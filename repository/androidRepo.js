const coverageDir = process.env.COVERAGE_ROOT_DIR
console.log(coverageDir)
// const coverageDir = '/canglong/coverage'
// 备份文件：Android/backup/FXJ/100

const path = {
  backupDir: coverageDir + '/Android/backup',
  reportDir: coverageDir + '/Android/report',
  logDir: coverageDir + '/log/Android',
  reportJarPath: coverageDir + '/Android/tools/report-0.0.3-alpha01-all.jar',
  reportCreateShell: coverageDir + '/Android/tools/report-create.sh'
}
console.log('hello cccc')

const fs = require('fs')
const { exec } = require('node:child_process')

// 日志文件：log/Android/FXJ/200/FXJ-200-Redmi22041211AC-2303131412082.ec
function queryLogList (appName, buildNum) {
  const logDir = `${path.logDir}/${appName}/${buildNum}`
  console.log(`logDir:${logDir}`)
  const prefix = `${appName}-${buildNum}`

  const fileNames = fs
    .readdirSync(logDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.ec'))
  // .map((name) => `${subDir}/${name}`);
  console.log(fileNames)

  //   var logs=  fileNames.map(fileName=>{path:`${logDir}/${fileName}`});
  const logs = fileNames.map((fileName) => {
    return { name: fileName, path: `${logDir}/${fileName}` }
  })
  console.log(logs)
  return logs
}

// 报告文件 Android/report/FXJ/200-8-20230322161838
function queryReportList (appName, buildNum, pageIndex, pageSize) {
  const dir = `${path.reportDir}/${appName}`
  let fileNames = fs
    .readdirSync(dir)
    .filter((name) => !buildNum || name.startsWith(buildNum))
    .filter((name) => {
      const ss = name.split('-')
      return ss.length === 3 && ss[2].length === 14
    })
    .sort((a, b) => {
      return b.slice(b.length - 14) - a.slice(a.length - 14)
    })

  //   fileNames = fileNames.reverse()
  const num = parseInt(!pageIndex || pageIndex < 1 ? 1 : pageIndex)
  const size = parseInt(
    !pageSize || pageSize <= 0 || pageSize > 50 ? 10 : pageSize
  )
  const start = (num - 1) * size
  const end = start + size
  const count = fileNames.length

  if (start >= count) {
    return []
  }

  fileNames = fileNames.slice(start, Math.min(end, count))

  const reporties = fileNames
    .map((fileName) => toReportJson(dir, appName, fileName))
    .filter((report) => report)
  //   console.log(reporties);
  return {
    pageNo: num,
    pageSize: size,
    list: reporties,
    count
  }
}

// /Users/canglong/Downloads/coverage/report/FXJ/200-8-20230316141640
function toReportJson (dir, appName, fileName) {
  const ss = fileName.split('-')
  if (ss.length < 2) {
    return null
  }
  const [buildNum, relativebuildNum, time] = ss

  let formatTime = time
  if (time.length === 14) {
    formatTime = ''
      .concat(time.slice(0, 4)).concat('年')
      .concat(time.slice(4, 6)).concat('月')
      .concat(time.slice(6, 8)).concat('日 ')
      .concat(time.slice(8, 10)).concat(':')
      .concat(time.slice(10, 12)).concat(':')
      .concat(time.slice(12, 14))
  }

  return {
    appName,
    fileName,
    buildNum,
    relativebuildNum,
    increment: relativebuildNum > 0,
    formatTime,
    previewUrl: `http://iosci.webuyops.com:9000/report-html/Android/report/${appName}/${fileName}/index.html`,
    downloadUrl: `http://file-tx.webuyops.com/download/mobile-coco/${appName}-${fileName}.zip`
  }
}

/**
 * java -jar /Users/mac/coverage/report-0.0.1-alpha5-all.jar \
--ecFiles=/Users/mac/coverage/log/fxj_3_20230313-140501-998.ec,/Users/mac/coverage/log/fxj_3_20230313-141350-386.ec \
--backupDir=/Users/mac/coverage/backup/fxj-CocoBackup \
--buildNum=3 \
--relativebuildNum=2 \
--reportOutDir=/Users/mac/coverage/report/fxj/3 \
--gitUsername=fxjia-canglong \
--gitPwd=mwq3012317217
 * @param {*} reqBody
 */
function createReport (reqBody, shellHandler) {
  let { appName, buildNum, logs, relativebuildNum } = reqBody
  if (!relativebuildNum) {
    relativebuildNum = 0
  }

  const ecFilesText = ecTextOf(logs)
  const outDateDir = dateDir()
  const cmd =
    `sh ${path.reportCreateShell} \\\n` +
    `${appName} \\\n` +
    `${ecFilesText} \\\n` +
    `${path.backupDir}/${appName} \\\n` +
    `${buildNum} \\\n` +
    `${relativebuildNum} \\\n` +
    `${path.reportDir}/${appName} \\\n` +
    `${outDateDir} \\\n` +
    'coverage-server'

  console.log(`exec shell ==>\n${cmd}`)

  exec(cmd, shellHandler)
  console.log('shell end ========>')
}
function ecTextOf (logs) {
  let ecFilesText = ''
  for (const log of logs) {
    ecFilesText = ecFilesText.concat(`,${log.buildLogDir}`)
  }
  if (ecFilesText) {
    ecFilesText = ecFilesText.substring(1)
  }
  return ecFilesText
}

function dateDir () {
  const date = new Date()
  const y = date.getFullYear()
  const m = prefixZero(date.getMonth() + 1)
  const d = prefixZero(date.getDate())
  const h = prefixZero(date.getHours())
  const minute = prefixZero(date.getMinutes())
  const second = prefixZero(date.getSeconds())
  //   second = second < 10 ? '0' + second : second
  return `${y}${m}${d}${h}${minute}${second}`
}

function prefixZero (value) {
  return value < 10 ? `0${value}` : `${value}`
}

// log/Android/FXJ/
function queryLogBuildList (appName) {
  const logDir = `${path.logDir}/${appName}`

  const buildNums = fs.readdirSync(logDir).filter((buildNum) => buildNum > 0).sort((a, b) => b - a)
  console.log(buildNums)
  return buildNums.map((num) => { return { buildNum: num, buildLogDir: `${logDir}/${num}` } })
}

// function queryJenkinsBuildInfo(appName, buildNum) {
//   var projectName = '';
//   if (appName === 'FXJ') {
//     projectName = '蜂享家掌柜-Android'
//   }
// }
// queryLogBuildList('FXJ')
// queryReportList('FXJ')

module.exports = {
  queryLogList,
  queryReportList,
  queryLogBuildList,
  createReport
}
