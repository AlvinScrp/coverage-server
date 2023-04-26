const coverageDir = process.env.COVERAGE_ROOT_DIR
// const coverageDir = '/Users/canglong/Downloads/coverage2'
console.log(coverageDir)
// const coverageDir = '/canglong/coverage'
// 备份文件：Android/backup/FXJ/100

const path = {
  backupDir: coverageDir + '/iOS',
  reportDir: coverageDir + '/iOS',
  logDir: coverageDir + '/log/iOS',
  buildInfoDir: coverageDir + '/buildInfo/iOS',
  parseProfrawShell: coverageDir + '/iOS/parseProfraw.sh'
}
console.log('hello cccc')

const fs = require('fs')
const { exec } = require('node:child_process')
const urlencode = require('urlencode')
const request = require('sync-request')

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
    previewUrl: `http://iosci.webuyops.com:9000/report-html/iOS/${appName}/Result/${fileName}/html-${fileName}/index.html`
  }
}

/**
 * sh parseProfraw.sh FXJ 211 200
 * @param {*} reqBody
 */
function createReport (reqBody, shellHandler) {
  let { appName, buildNum, relativebuildNum } = reqBody
  if (!relativebuildNum) {
    relativebuildNum = 0
  }
  const cmd = `sh ${path.parseProfrawShell} ${appName}  ${buildNum} ${relativebuildNum}`
  console.log(`exec shell ==>\n${cmd}`)
  exec(cmd, shellHandler)
  console.log('shell end========>')
}

// log/Android/FXJ/
function queryLogBuildList (appName) {
  const logDir = `${path.logDir}/${appName}`
  const backupDir = `${path.backupDir}/${appName}`

  const buildNums = fs.readdirSync(backupDir).filter((buildNum) => buildNum > 0).sort((a, b) => b - a)
  console.log(buildNums)
  return buildNums.map((num) => {
    const buildLogDir = `${logDir}/${num}`
    const jenkinsInfo = queryJenkinsBuildInfo(appName, num)
    const hasLogDir = fs.existsSync(buildLogDir)
    return { buildNum: num, buildLogDir, hasLogDir, jenkinsInfo }
  })
}

function queryJenkinsBuildInfo (appName, buildNum) {
  console.log('queryJenkinsBuildInfo')
  try {
    const json = getJekinsBuildInfo(appName, buildNum)
    if (json) {
      const buildInfo = {
        branch: '',
        environment: '',
        isDeploy: false,
        userName: '',
        number: 0,
        url: '',
        result: '',
        timeFormat: '',
        changes: []
      }

      json.actions.forEach(function (action) {
        if (action._class === 'hudson.model.ParametersAction') {
          action.parameters.forEach(function (p) {
            if (p.name === 'Branch') {
              buildInfo.branch = p.value
            } else if (p.name === 'Archive') {
              buildInfo.environment = p.value.startsWith('Daily') ? 'Daily' : (p.value.startsWith('Gray') ? 'Gray' : 'Online')
            } else if (p.name === 'ExportType') {
              buildInfo.isDeploy = p.value === 'AppStore(审核包)'
            }
          })
        } else if (action._class === 'hudson.model.CauseAction') {
          action.causes.forEach(function (cause) {
            if (cause._class === 'hudson.model.Cause$UserIdCause') {
              buildInfo.userName = cause.userName
            }
          })
        }
      })
      //   json.changeSets.forEach(function (changeSet) {
      //     if (changeSet._class === 'hudson.plugins.git.GitChangeSetList') {
      //       changeSet.items.forEach(function (item) {
      //         const { commitId, authorEmail, comment, date, id, msg, affectedPaths } = item
      //         buildInfo.changes.push({ commitId, authorEmail, comment, date, id, msg, affectedPaths })
      //       })
      //     }
      //   })
      buildInfo.number = json.number
      buildInfo.timeFormat = timeFormat(json.timestamp)
      buildInfo.url = json.url
      buildInfo.result = json.result
      return buildInfo
    }
  } catch (error) {
    console.error(error.message)
  }
  return null
}

function getJekinsBuildInfo (appName, buildNum) {
  console.log('getJekinsBuildInfo')
  if (!coverageDir) throw new Error('coverageDir undefined')
  const infoDir = `${path.buildInfoDir}/${appName}`
  const infoTxtPath = `${infoDir}/${buildNum}.txt`
  let info = null
  try {
    if (fs.existsSync(infoTxtPath)) {
      const infoJson = fs.readFileSync(infoTxtPath, 'utf-8')
      try {
        info = JSON.parse(infoJson)
        if (info.number && info.timestamp && info.url) {
          console.log(`exists info: ${infoTxtPath}`)
          return info
        }
      } catch (jsonError) {
        console.log(jsonError.message)
      }
    }

    let projectName = ''
    if (appName === 'FXJ') {
      projectName = '蜂享家掌柜-iOS'
    } else if (appName === 'HYK') {
      projectName = '好衣库-iOS'
    }
    const encodeProjectName = urlencode(projectName)
    const url = `http://canglong:1178849ec1d2f2ce79b75c9dc59cc41e1a@iosci.webuyops.com:8001/job/${encodeProjectName}/${buildNum}/api/json?pretty=true&tree=number,displayName,timestamp,url,result,actions[parameters[name,value],causes[userName]],changeSets[items[*]]`
    console.log(url)
    const res = request('GET', url)
    const infoJson = res.getBody().toString()
    info = JSON.parse(infoJson)
    try {
      if (!fs.existsSync(infoDir)) {
        fs.mkdirSync(infoDir, { recursive: true })
      }
      fs.writeFileSync(infoTxtPath, infoJson)
    } catch (fileError) {
      console.error(fileError.message)
    }
    return info
  } catch (error) {
    console.error(error.message)
  }
  return null
}

function timeFormat (timestamp) {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = prefixZero(date.getMonth() + 1)
  const d = prefixZero(date.getDate())
  const h = prefixZero(date.getHours())
  const minute = prefixZero(date.getMinutes())
  const second = prefixZero(date.getSeconds())
  //   second = second < 10 ? '0' + second : second
  return `${y}年${m}月${d}日${h}:${minute}:${second}`
}
function prefixZero (value) {
  return value < 10 ? `0${value}` : `${value}`
}

// function queryJenkinsBuildInfo(appName, buildNum) {
//   var projectName = '';
//   if (appName === 'FXJ') {
//     projectName = '蜂享家掌柜-Android'
//   }
// }
// queryLogBuildList('FXJ')
// queryReportList('FXJ')

// const info = queryJenkinsBuildInfo('FXJ', 230)
// console.log(info)

module.exports = {
  queryLogList,
  queryReportList,
  queryLogBuildList,
  createReport
}
