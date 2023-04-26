const coverageDir = process.env.COVERAGE_ROOT_DIR
console.log(coverageDir)
// const coverageDir = '/Users/canglong/Downloads/coverage2'
// 备份文件：Android/backup/FXJ/100

const path = {
  backupDir: coverageDir + '/Android/backup',
  buildInfoDir: coverageDir + '/buildInfo/Android',
  reportDir: coverageDir + '/Android/report',
  logDir: coverageDir + '/log/Android',
  reportJarPath: coverageDir + '/Android/tools/report-0.0.3-alpha01-all.jar',
  reportCreateShell: coverageDir + '/Android/tools/report-create.sh'
}
console.log('hello cccc')

const fs = require('fs')
const { exec } = require('node:child_process')
// const request = require('request')
const urlencode = require('urlencode')
const request = require('sync-request')

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
            if (p.name === 'appBranch') {
              buildInfo.branch = p.value.startsWith('origin/') ? p.value.slice(7) : p.value
            } else if (p.name === 'appEnvironment') {
              buildInfo.environment = p.value
            } else if (p.name === 'shouldDeploy') {
              buildInfo.isDeploy = p.value
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
      json.changeSets.forEach(function (changeSet) {
        if (changeSet._class === 'hudson.plugins.git.GitChangeSetList') {
          changeSet.items.forEach(function (item) {
            const { commitId, authorEmail, comment, date, id, msg, affectedPaths } = item
            buildInfo.changes.push({ commitId, authorEmail, comment, date, id, msg, affectedPaths })
          })
        }
      })
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
      projectName = '蜂享家掌柜-Android'
    } else if (appName === 'HYK') {
      projectName = '好衣库-Android'
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
// queryLogBuildList('FXJ')
// queryReportList('FXJ')
// const info = queryJenkinsBuildInfo('FXJ', 253)
// console.log(info)

module.exports = {
  queryLogList,
  queryReportList,
  queryLogBuildList,
  createReport
}
