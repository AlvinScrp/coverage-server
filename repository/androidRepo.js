const coverageDir = '/Users/canglong/Downloads/coverage2'

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
  const fileNames = fs
    .readdirSync(dir)
    .filter((name) => !buildNum || name.startsWith(buildNum))
  let fileInfos = fileNames.map((fileName) => fileInfoWithTime(dir, fileName))
  fileInfos = fileInfos.sort((a, b) => b.birthtimeMs - a.birthtimeMs)

  //   fileNames = fileNames.reverse()
  console.log(fileInfos)
  const num = pageIndex == null || pageIndex < 1 ? 1 : pageIndex
  const size = parseInt(
    pageSize == null || pageSize <= 0 || pageSize > 50 ? 10 : pageSize
  )
  const start = (num - 1) * size
  const end = start + size
  const count = fileInfos.length

  if (start >= count) {
    return []
  }

  fileInfos = fileInfos.slice(start, Math.min(end, count))

  const reporties = fileInfos.map((fileInfo) =>
    toReportJson(dir, appName, fileInfo)
  )
  //   console.log(reporties);
  return {
    pageNo: num,
    pageSize: size,
    list: reporties,
    count
  }
}

function fileInfoWithTime (dir, name) {
  const stat = fs.statSync(`${dir}/${name}`)
  const birthtimeMs = stat.birthtimeMs
  return { name, birthtimeMs }
}
// /Users/canglong/Downloads/coverage/report/FXJ/200-8-20230316141640
function toReportJson (dir, appName, fileInfo) {
  const fileName = fileInfo.name
  const ss = fileName.split('-')
  if (ss.length < 2) {
    return null
  }
  const [buildNum, relativebuildNum] = ss

  const timestamp = fileInfo.birthtimeMs // 一个时间戳，单位为毫秒
  const date = new Date(timestamp)
  const year = date.getFullYear() // 年份
  const month = prefixZero(date.getMonth() + 1) // 月份，注意月份从 0 开始，需要加 1
  const day = prefixZero(date.getDate()) // 日
  const hours = prefixZero(date.getHours()) // 小时
  const minutes = prefixZero(date.getMinutes()) // 分钟
  const seconds = prefixZero(date.getSeconds()) // 秒

  const formatTime = `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`

  const increment = relativebuildNum > 0
  const previewUrl = `${dir}/${fileInfo.name}`

  return {
    appName,
    buildNum,
    relativebuildNum,
    increment,
    formatTime,
    previewUrl,
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
function createReport (reqBody) {
  let { appName, buildNum, logs, increment, relativebuildNum } = reqBody
  if (!relativebuildNum || !increment) {
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
function ecTextOf (logs) {
  let ecFilesText = ''
  for (const log of logs) {
    ecFilesText = ecFilesText.concat(`,${log.path}`)
  }
  if (ecFilesText) {
    ecFilesText = ecFilesText.substring(1)
  }
  return ecFilesText
}

// function toLogJson(fileName) {
//   console.log(fileName);
//   var infos = fileName.replace(".ec", "").split("_");
//   if (infos.length != 4) {
//     return null;
//   }
//   var [appName,buildNum,phoneName,time] =infos
//   console.log({appName,buildNum,phoneName,time});
// }

// queryLogList("fxj", "200");
// queryReportList('FXJ', 200, 1, 100);

function dateDir () {
  const date = new Date()
  const y = date.getFullYear()
  const m = prefixZero(date.getMonth() + 1)
  const d = prefixZero(date.getDate())
  const h = prefixZero(date.getHours())
  const minute = prefixZero(date.getMinutes())
  let second = prefixZero(date.getSeconds())
  second = second < 10 ? '0' + second : second
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
  //   const request = require('request');
  //   console.log(buildNums);
  // https://attacomsian.com/blog/node-http-requests-using-request-module
  //   var jenkinsUrl =
  //     'http://iosci.webuyops.com:8001/job/%E8%9C%82%E4%BA%AB%E5%AE%B6%E6%8E%8C%E6%9F%9C-Android/222/api/json?pretty=true&tree=fullDisplayName[*],number[*],timestamp[*],url[*],actions[causes[userName]]';

//   request.get(
//     jenkinsUrl,
//     {
//       auth: {
//         username: 'canglong',
//         password: '11017da435606c7249dd328422dfd245bf',
//       },
//     },
//     (err, res, body) => {
//       if (err) {
//         return console.log(err);
//       }
//       console.log(body);
//     }
//   );
}

// function queryJenkinsBuildInfo(appName, buildNum) {
//   var projectName = '';
//   if (appName === 'FXJ') {
//     projectName = '蜂享家掌柜-Android'
//   }
// }
// queryLogBuildList('FXJ')

module.exports = {
  queryLogList,
  queryReportList,
  queryLogBuildList,
  createReport
}
