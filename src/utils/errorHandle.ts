// import { exitApp } from '@/utils/common'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import { log } from '@/utils/log'
import { toast, tipDialog } from './tools'

const errorHandler = (e: Error, isFatal: boolean) => {
  const excludedErrors = [
    'Failed to construct \'Response\'',
  ]
  if (isFatal) {
    if (excludedErrors.some((excludedError) => e.message.includes(excludedError))) {
      toast('应用遇到了错误，如果你有固定的复现方式，请截图并附上具体的操作步骤，以及“设置-错误日志”的内容，方便定位问题')
    } else {
      void tipDialog({
        title: '💥 应用出现异常',
        message: `应用出 bug 了😭，以下是错误异常信息。请截图并附上刚才你进行了什么操作，以及“设置-错误日志”的内容，方便定位问题。现在应用可能会出现异常，若出现异常请尝试强制结束应用后重新启动！

Error:
${isFatal ? 'Fatal:' : ''} ${e.name} ${e.message}
`,
        btnText: '关闭 (Close)',
      })
    }
  }
  log.error(e.stack)
}

if (process.env.NODE_ENV !== 'development') {
  setJSExceptionHandler(errorHandler)

  setNativeExceptionHandler((errorString) => {
    log.error(errorString)
    console.log('+++++', errorString, '+++++')
  }, false)
}
