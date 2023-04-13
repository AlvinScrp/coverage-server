const coverageDir = process.env.COVERAGE_ROOT_DIR
console.log(coverageDir)
// const coverageDir = '/canglong/coverage'
// 备份文件：Android/backup/FXJ/100

const path = {
  backupDir: coverageDir + '/iOS',
  reportDir: coverageDir + '/iOS',
  logDir: coverageDir + '/log/iOS',
  parseProfrawShell: coverageDir + '/iOS/parseProfraw.sh'
}
console.log('hello cccc')

const fs = require('fs')
const { exec } = require('node:child_process')

// 日志文件：/log/iOS/FXJ/207/FXJ-204-C9B58D668C3945B09701109311D61E1D.profraw
function queryLogList (appName, buildNum) {
  const logDir = `${path.logDir}/${appName}/${buildNum}`
  console.log(`logDir:${logDir}`)
  const prefix = `${appName}-${buildNum}`

  const fileNames = fs
    .readdirSync(logDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.profraw'))
  console.log(fileNames)

  const logs = fileNames.map((fileName) => {
    return { name: fileName, path: `${logDir}/${fileName}` }
  })
  console.log(logs)
  return logs
}

// 报告文件 iOS/FXJ/Result/211-202-20230411184231/html-211-202-20230411184231
function queryReportList (appName, buildNum, pageIndex, pageSize) {
  const dir = `${path.reportDir}/${appName}/Result`
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
    previewUrl: `http://iosci.webuyops.com:9003/iOS/${appName}/Result/${fileName}/html-${fileName}/index.html`
  }
}

/**
 * sh parseProfraw.sh FXJ 211 200
 * @param {*} reqBody
 */
function createReport (reqBody) {
  let { appName, buildNum, relativebuildNum } = reqBody
  if (!relativebuildNum) {
    relativebuildNum = 0
  }

  const cmd = `sh ${path.parseProfrawShell} ${appName}  ${buildNum} ${relativebuildNum}`

  console.log(`exec shell ==>\n${cmd}`)

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    console.log(`stdout: \n${stdout}`)
    //   console.error(`stderr: ${stderr}`);
  })
  console.log('eneeeed========>')
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
