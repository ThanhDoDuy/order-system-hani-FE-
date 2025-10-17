"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Đã xảy ra lỗi</CardTitle>
              <CardDescription>
                Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <strong>Chi tiết lỗi:</strong>
                  <pre className="mt-1 text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={this.resetError}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thử lại
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={() => window.location.href = '/login'}
                >
                  Đăng nhập lại
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                Nếu lỗi vẫn tiếp tục, vui lòng liên hệ quản trị viên
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // You can add additional error reporting here
  }
}
