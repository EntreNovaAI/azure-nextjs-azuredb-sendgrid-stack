'use client'

import React, { useState } from 'react'

interface CalculatorProps {
  accessLevel: string
}

/**
 * Calculator Component
 * Simple calculator with features that vary by access level:
 * - Free: Basic arithmetic only
 * - Basic: Includes memory functions and history
 * - Premium: Advanced functions like percentage, square root, etc.
 */
export function Calculator({ accessLevel }: CalculatorProps) {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)
  const [memory, setMemory] = useState(0)
  const [history, setHistory] = useState<string[]>([])

  // Feature availability based on access level
  const hasMemoryFunctions = accessLevel !== 'free'
  const hasAdvancedFunctions = accessLevel === 'premium'
  const hasHistory = accessLevel !== 'free'

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num)
      setWaitingForNewValue(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
      
      // Add to history if available
      if (hasHistory) {
        setHistory(prev => [...prev.slice(-4), `${currentValue} ${operation} ${inputValue} = ${newValue}`])
      }
    }

    setWaitingForNewValue(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '×':
        return firstValue * secondValue
      case '÷':
        return firstValue / secondValue
      default:
        return secondValue
    }
  }

  const performCalculation = () => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      
      // Add to history if available
      if (hasHistory) {
        setHistory(prev => [...prev.slice(-4), `${previousValue} ${operation} ${inputValue} = ${newValue}`])
      }
      
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(false)
  }

  const clearEntry = () => {
    setDisplay('0')
    setWaitingForNewValue(false)
  }

  // Memory functions (Basic and Premium only)
  const memoryRecall = () => {
    if (hasMemoryFunctions) {
      setDisplay(String(memory))
      setWaitingForNewValue(true)
    }
  }

  const memoryAdd = () => {
    if (hasMemoryFunctions) {
      setMemory(memory + parseFloat(display))
    }
  }

  const memoryClear = () => {
    if (hasMemoryFunctions) {
      setMemory(0)
    }
  }

  // Advanced functions (Premium only)
  const percentage = () => {
    if (hasAdvancedFunctions) {
      const value = parseFloat(display) / 100
      setDisplay(String(value))
      setWaitingForNewValue(true)
    }
  }

  const squareRoot = () => {
    if (hasAdvancedFunctions) {
      const value = Math.sqrt(parseFloat(display))
      setDisplay(String(value))
      setWaitingForNewValue(true)
    }
  }

  const square = () => {
    if (hasAdvancedFunctions) {
      const value = Math.pow(parseFloat(display), 2)
      setDisplay(String(value))
      setWaitingForNewValue(true)
    }
  }

  return (
    <div className="max-w-[400px] mx-auto bg-white rounded-xl shadow p-6 border border-slate-200">
      <div className="bg-slate-800 text-white p-4 rounded-lg mb-4 relative min-h-[60px] flex items-center justify-end">
        <div className="text-2xl font-semibold font-mono break-all">{display}</div>
        {memory !== 0 && hasMemoryFunctions && (
          <div className="absolute top-2 left-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">M</div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {/* Row 1: Clear and Memory (if available) */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={clear} className="px-4 py-3 rounded-lg text-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition">C</button>
          <button onClick={clearEntry} className="px-4 py-3 rounded-lg text-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition">CE</button>
          {hasMemoryFunctions ? (
            <>
              <button onClick={memoryRecall} className="px-4 py-3 rounded-lg text-lg font-semibold bg-amber-500 text-white hover:bg-amber-600 transition">MR</button>
              <button onClick={memoryClear} className="px-4 py-3 rounded-lg text-lg font-semibold bg-amber-500 text-white hover:bg-amber-600 transition">MC</button>
            </>
          ) : (
            <>
              <button disabled className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">MR</button>
              <button disabled className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">MC</button>
            </>
          )}
        </div>

        {/* Row 2: Advanced functions (Premium only) */}
        <div className="grid grid-cols-4 gap-2">
          {hasAdvancedFunctions ? (
            <>
              <button onClick={percentage} className="px-4 py-3 rounded-lg text-lg font-semibold bg-violet-500 text-white hover:bg-violet-600 transition">%</button>
              <button onClick={squareRoot} className="px-4 py-3 rounded-lg text-lg font-semibold bg-violet-500 text-white hover:bg-violet-600 transition">√</button>
              <button onClick={square} className="px-4 py-3 rounded-lg text-lg font-semibold bg-violet-500 text-white hover:bg-violet-600 transition">x²</button>
            </>
          ) : (
            <>
              <button disabled className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">%</button>
              <button disabled className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">√</button>
              <button disabled className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">x²</button>
            </>
          )}
          <button onClick={() => inputOperation('÷')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">÷</button>
        </div>

        {/* Row 3: Numbers 7-9 and multiply */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => inputNumber('7')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">7</button>
          <button onClick={() => inputNumber('8')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">8</button>
          <button onClick={() => inputNumber('9')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">9</button>
          <button onClick={() => inputOperation('×')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">×</button>
        </div>

        {/* Row 4: Numbers 4-6 and subtract */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => inputNumber('4')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">4</button>
          <button onClick={() => inputNumber('5')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">5</button>
          <button onClick={() => inputNumber('6')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">6</button>
          <button onClick={() => inputOperation('-')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">-</button>
        </div>

        {/* Row 5: Numbers 1-3 and add */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => inputNumber('1')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">1</button>
          <button onClick={() => inputNumber('2')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">2</button>
          <button onClick={() => inputNumber('3')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">3</button>
          <button onClick={() => inputOperation('+')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">+</button>
        </div>

        {/* Row 6: Zero, decimal, memory add, equals */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => inputNumber('0')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition col-span-1">0</button>
          <button onClick={() => inputNumber('.')} className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition">.</button>
          {hasMemoryFunctions ? (
            <button onClick={memoryAdd} className="px-4 py-3 rounded-lg text-lg font-semibold bg-amber-500 text-white hover:bg-amber-600 transition">M+</button>
          ) : (
            <button disabled className="px-4 py-3 rounded-lg text-lg font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">M+</button>
          )}
          <button onClick={performCalculation} className="px-4 py-3 rounded-lg text-lg font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition">=</button>
        </div>
      </div>

      {/* History section (Basic and Premium only) */}
      {hasHistory && history.length > 0 && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="text-sm text-slate-500 mb-2">Recent Calculations</h4>
          <div className="flex flex-col gap-1">
            {history.slice(-3).map((calculation, index) => (
              <div key={index} className="text-xs text-slate-700 font-mono p-1 bg-white rounded">
                {calculation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature notice */}
      <div className="mt-4">
        <div className="p-3 rounded-lg text-center text-sm bg-slate-100">
          {accessLevel === 'free' && (
            <p className="m-0">🔒 Upgrade to <strong>Basic</strong> for memory functions and calculation history</p>
          )}
          {accessLevel === 'basic' && (
            <p className="m-0">🔒 Upgrade to <strong>Premium</strong> for advanced functions (%, √, x²)</p>
          )}
          {accessLevel === 'premium' && (
            <p className="m-0">✨ You have access to all calculator features!</p>
          )}
        </div>
      </div>
    </div>
  )
}
