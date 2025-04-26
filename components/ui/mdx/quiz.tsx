'use client'

import React, { useState } from 'react'
import { Card } from '../card'
import { Button } from '../button'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { Label } from '../label'
import { cn } from '@/lib/utils'

interface Question {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface QuizProps {
  questions: Question[]
  className?: string
  onComplete?: (score: number) => void
}

export function Quiz({ questions, className, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  const handleAnswer = (answer: number) => {
    setSelectedAnswer(answer)
  }

  const handleNext = () => {
    if (selectedAnswer === null) return

    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      const score = newAnswers.reduce((acc, answer, index) => {
        return answer === questions[index].correctAnswer ? acc + 1 : acc
      }, 0)
      onComplete?.(score)
      setShowResults(true)
    }
  }

  const calculateScore = () => {
    return answers.reduce((acc, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc
    }, 0)
  }

  if (showResults) {
    const score = calculateScore()
    return (
      <Card className={cn("p-6", className)}>
        <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
        <p className="text-lg mb-4">
          Your score: {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
        </p>
        <Button onClick={() => {
          setCurrentQuestion(0)
          setAnswers([])
          setShowResults(false)
          setSelectedAnswer(null)
        }}>
          Retry Quiz
        </Button>
      </Card>
    )
  }

  const question = questions[currentQuestion]

  return (
    <Card className={cn("p-6", className)}>
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>
      <h3 className="text-lg font-medium mb-4">{question.question}</h3>
      <RadioGroup
        value={selectedAnswer?.toString()}
        onValueChange={(value) => handleAnswer(parseInt(value))}
        className="space-y-3"
      >
        {question.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
            <Label htmlFor={`option-${index}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
      {showExplanation && question.explanation && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">{question.explanation}</p>
        </div>
      )}
      <div className="mt-6 flex gap-4">
        <Button onClick={handleNext} disabled={selectedAnswer === null}>
          {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
        </Button>
        {question.explanation && !showExplanation && (
          <Button
            variant="outline"
            onClick={() => setShowExplanation(true)}
            disabled={selectedAnswer === null}
          >
            Show Explanation
          </Button>
        )}
      </div>
    </Card>
  )
}
