#!/usr/bin/env python3
"""
Azure Deployment TUI (Text User Interface)

A Textual-based terminal UI for managing Azure deployments.
This is a basic version that runs the prerequisite validation script.

Usage:
    python scripts/deploy/deploy_tui.py

Requirements:
    - Python 3.9+
    - textual (install via: pip install textual)
"""

import os
import sys
import subprocess
from pathlib import Path
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Button, Static, Log
from textual.containers import Container, Vertical

# Import constants from the constants package
# All constants are organized into logical modules for better maintainability
from constants import (
    # UI constants
    APP_CSS,
    KEY_BINDINGS,
    APP_TITLE,
    WELCOME_MESSAGE,
    BUTTON_VALIDATE,
    BUTTON_CLEAR,
    MSG_RUNNING_VALIDATION,
    MSG_VALIDATION_SUCCESS,
    MSG_VALIDATION_WARNINGS,
    MSG_VALIDATION_FAILED,
    MSG_OUTPUT_CLEARED,
    MSG_CLICK_TO_VALIDATE,
    ERR_SCRIPT_NOT_FOUND,
    ERR_BASH_NOT_FOUND,
    ERR_BASH_HINT,
    ERR_PERMISSION_DENIED,
    ERR_PERMISSION_HINT,
    ERR_UNEXPECTED,
    SEPARATOR,
    # Path constants
    VALIDATION_SCRIPT_PATH,
    # Subprocess configuration
    BASH_FLAGS,
    SUBPROCESS_ENCODING,
    SUBPROCESS_ERROR_HANDLING,
    # Exit codes
    EXIT_CODE_SUCCESS,
    EXIT_CODE_WARNINGS,
)


class DeploymentTUI(App):
    """
    Basic Textual application for Azure deployment tasks.

    Currently supports:
    - Running prerequisite validation
    """

    # CSS styling for the application (imported from constants)
    CSS = APP_CSS

    # Key bindings displayed in footer (imported from constants)
    BINDINGS = KEY_BINDINGS

    def __init__(self):
        """Initialize the application."""
        super().__init__()
        # Get the project root directory (two levels up from this script)
        self.script_dir = Path(__file__).parent
        self.project_root = self.script_dir.parent.parent

    def compose(self) -> ComposeResult:
        """
        Create the layout of the application.

        Layout structure:
        - Header (automatic from Textual)
        - Title section
        - Button container with action buttons
        - Output log for displaying command results
        - Footer with key bindings (automatic from Textual)
        """
        yield Header()
        yield Container(
            Static(APP_TITLE, classes="title"),
            Vertical(
                Button(BUTTON_VALIDATE,
                       id="validate_btn", variant="primary"),
                Button(BUTTON_CLEAR, id="clear_btn", variant="default"),
                id="button-container"
            ),
            Log(id="output-log", highlight=True),
            id="main-container"
        )
        yield Footer()

    def on_mount(self) -> None:
        """Called when the app is mounted. Display welcome message."""
        log = self.query_one("#output-log", Log)
        log.write_line(WELCOME_MESSAGE)
        log.write_line(f"Project root: {self.project_root}")
        log.write_line("")
        log.write_line(MSG_CLICK_TO_VALIDATE)
        log.write_line("")

    async def on_button_pressed(self, event: Button.Pressed) -> None:
        """
        Handle button press events.

        Routes button clicks to appropriate handler methods.
        """
        if event.button.id == "validate_btn":
            await self.run_validation()
        elif event.button.id == "clear_btn":
            self.action_clear()

    async def run_validation(self) -> None:
        """
        Run the prerequisite validation script with real-time output.

        Uses asyncio subprocess for true real-time streaming with unbuffered I/O.
        This ensures immediate output display and proper error capture.
        """
        log = self.query_one("#output-log", Log)

        # Clear previous output
        log.clear()
        log.write_line(SEPARATOR)
        log.write_line(MSG_RUNNING_VALIDATION)
        log.write_line(SEPARATOR)
        log.write_line("")

        # Show diagnostic info for debugging PATH issues
        log.write_line("🔍 Environment Diagnostics:")
        log.write_line(f"   OS: {sys.platform}")
        log.write_line(f"   Python: {sys.version.split()[0]}")
        log.write_line("")

        # Path to the validation script (for existence check)
        script_path = self.script_dir / "00_validate_prerequisites" / \
            "00_validate_prerequisites.sh"

        # Check if script exists
        if not script_path.exists():
            log.write_line(ERR_SCRIPT_NOT_FOUND.format(script_path))
            return

        try:
            # Prepare environment for unbuffered output and proper PATH handling
            # This is critical for real-time display and tool availability
            env = os.environ.copy()

            # Force unbuffered output from Python scripts called by bash
            env["PYTHONUNBUFFERED"] = "1"

            # Windows-specific PATH handling
            # Git Bash can lose access to Windows PATH if not properly configured
            if sys.platform.startswith("win"):
                # Windows: Use UTF-8 for proper emoji display
                env["PYTHONIOENCODING"] = "utf-8"

                # CRITICAL: Preserve Windows PATH for Git Bash
                # Git Bash converts Windows paths to Unix-style paths
                # We need to ensure the original Windows PATH is available
                if "PATH" in env:
                    # Get the current PATH from Windows
                    windows_path = env["PATH"]

                    # Also set ORIGINAL_PATH so bash scripts can reference it
                    env["ORIGINAL_PATH"] = windows_path

                    # Ensure common Windows tool paths are included
                    # These are often where Azure CLI, Node.js, etc. are installed
                    common_paths = [
                        r"C:\Program Files\Azure CLI\wbin",
                        r"C:\Program Files (x86)\Azure CLI\wbin",
                        r"C:\Program Files\nodejs",
                        r"C:\Program Files\Docker\Docker\resources\bin",
                        os.path.expandvars(
                            r"%USERPROFILE%\AppData\Local\Programs\Microsoft VS Code\bin"),
                        os.path.expandvars(r"%USERPROFILE%\.stripe"),
                    ]

                    # Add common paths if they exist and aren't already in PATH
                    for path in common_paths:
                        expanded_path = os.path.expandvars(path)
                        if os.path.exists(expanded_path) and expanded_path not in windows_path:
                            windows_path = f"{expanded_path};{windows_path}"

                    # Update the PATH in environment
                    env["PATH"] = windows_path

            # Build command with stdbuf for unbuffered output
            # stdbuf -o0 disables output buffering completely
            # This is key to getting real-time output from bash scripts
            command = ["bash"] + BASH_FLAGS + [VALIDATION_SCRIPT_PATH]

            # On Unix systems, prepend stdbuf for unbuffered output
            # On Windows (Git Bash), stdbuf may not be available, so we skip it
            if not sys.platform.startswith("win"):
                # Check if stdbuf is available
                try:
                    subprocess.run(
                        ["which", "stdbuf"],
                        capture_output=True,
                        timeout=1,
                        check=False  # Don't raise on non-zero exit
                    )
                    # Prepend stdbuf to disable output buffering
                    command = ["stdbuf", "-o0", "-e0"] + command
                except (subprocess.TimeoutExpired, FileNotFoundError):
                    pass  # stdbuf not available, continue without it

            # Use asyncio for truly async, non-blocking I/O
            # This prevents the UI from freezing during script execution
            # Import asyncio here to avoid unused import warning
            import asyncio
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,  # Capture stderr separately
                cwd=str(self.project_root),
                env=env,
            )

            # Process stdout and stderr concurrently for real-time output
            # This ensures we capture all output immediately as it's produced
            async def read_stream(stream, prefix=""):
                """Read from stream and write to log in real-time."""
                while True:
                    # Read one line at a time
                    line_bytes = await stream.readline()
                    if not line_bytes:
                        break

                    # Decode with error handling for emojis and special chars
                    try:
                        line = line_bytes.decode(
                            SUBPROCESS_ENCODING).rstrip("\n\r")
                    except UnicodeDecodeError:
                        # Fallback: replace invalid characters
                        line = line_bytes.decode(
                            SUBPROCESS_ENCODING,
                            errors=SUBPROCESS_ERROR_HANDLING
                        ).rstrip("\n\r")

                    # Write to log immediately (prefix helps identify stderr)
                    if line:  # Skip empty lines
                        log.write_line(f"{prefix}{line}")

            # Read stdout and stderr concurrently
            # This ensures we don't miss any output from either stream
            import asyncio
            await asyncio.gather(
                read_stream(process.stdout, ""),
                read_stream(process.stderr, "⚠️  STDERR: "),
            )

            # Wait for process to complete and get exit code
            return_code = await process.wait()

            # Show completion status based on exit code
            log.write_line("")
            log.write_line(SEPARATOR)
            if return_code == EXIT_CODE_SUCCESS:
                log.write_line(MSG_VALIDATION_SUCCESS)
            elif return_code == EXIT_CODE_WARNINGS:
                log.write_line(MSG_VALIDATION_WARNINGS)
            else:
                log.write_line(MSG_VALIDATION_FAILED.format(return_code))
            log.write_line(SEPARATOR)

        except FileNotFoundError:
            # Bash executable not found (e.g., not in PATH)
            log.write_line(ERR_BASH_NOT_FOUND)
            log.write_line(ERR_BASH_HINT)
        except PermissionError:
            # Script file exists but can't be executed
            log.write_line(ERR_PERMISSION_DENIED)
            log.write_line(ERR_PERMISSION_HINT.format(script_path))
        except (OSError, RuntimeError, ValueError) as e:
            # Common subprocess errors - show full details for debugging
            log.write_line(ERR_UNEXPECTED.format(type(e).__name__))
            log.write_line(f"   {str(e)}")

            # Also log stderr if available for debugging
            import traceback
            log.write_line("")
            log.write_line("Full traceback:")
            for line in traceback.format_exc().split("\n"):
                if line.strip():
                    log.write_line(f"   {line}")

    def action_clear(self) -> None:
        """Clear the output log."""
        log = self.query_one("#output-log", Log)
        log.clear()
        log.write_line(MSG_OUTPUT_CLEARED)
        log.write_line("")

    async def action_quit(self) -> None:
        """Quit the application."""
        self.exit()


def main():
    """Main entry point for the application."""
    app = DeploymentTUI()
    app.run()


if __name__ == "__main__":
    main()
