var path = require('../const/filePath');
console.log('hello cccc');

const fs = require('fs');
const { exec } = require('node:child_process');

function queryLogList(appName, buildNum) {
  const subDir = `${appName}_Android_${buildNum}`;
  const logDir = `${path.logDir}/${subDir}`;
  const prefix = `${appName}_${buildNum}`;

  var fileNames = fs
    .readdirSync(logDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.ec'));
  // .map((name) => `${subDir}/${name}`);
  console.log(fileNames);

  //   var logs=  fileNames.map(fileName=>{path:`${logDir}/${fileName}`});
  var logs = fileNames.map((fileName) => {
    return { name: fileName, path: `${logDir}/${fileName}` };
  });
  console.log(logs);
  return logs;
}

function queryReportList(appName, buildNum, pageIndex, pageSize) {
  const appDir = `${path.reportDir}/${appName}`;
  var fileNames = fs
    .readdirSync(appDir)
    .filter((name) => name.startsWith(appName))
    .sort((a, b) => {
      return b.slice(b.length - 14) - a.slice(a.length - 14);
    });
  if (buildNum != null) {
    var prefix = `${appName}_${buildNum}_`;
    fileNames = fileNames.filter((name) => name.startsWith(prefix));
  }
  //   fileNames = fileNames.reverse()
  console.log(fileNames);
  var num = pageIndex == null || pageIndex < 1 ? 1 : pageIndex;
  var size = parseInt(
    pageSize == null || pageSize <= 0 || pageSize > 50 ? 10 : pageSize
  );
  var start = (num - 1) * size;
  var end = start + size;
  var count = fileNames.length;

  if (start >= count) {
    return [];
  }

  fileNames = fileNames.slice(start, Math.min(end, count));

  var reporties = fileNames.map((fileName) =>
    toReportJson(appDir, appName, fileName)
  );
  //   console.log(reporties);
  return {
    pageNo: num,
    pageSize: size,
    list: reporties,
    count,
  };
}
// /Users/canglong/Downloads/coverage/report/fxj/fxj_200_8_20230316141640
function toReportJson(appDir, appName, fileName) {
  var infos = fileName.split('_');
  if (infos.length != 4) {
    return null;
  }
  var [appName, buildNum, relativebuildNum, time] = infos;
  var formatTime =
    time.length != 14
      ? time
      : ''
          .concat(time.slice(0, 4))
          .concat('年')
          .concat(time.slice(4, 6))
          .concat('月')
          .concat(time.slice(6, 8))
          .concat('日 ')
          .concat(time.slice(8, 10))
          .concat(':')
          .concat(time.slice(10, 12))
          .concat(':')
          .concat(time.slice(12, 14));
  var increment = relativebuildNum > 0;
  var dir = `${appDir}/${fileName}`;

  return {
    appName,
    buildNum,
    relativebuildNum,
    increment,
    formatTime,
    previewUrl: dir,
    downloadUrl: `http://file-tx.webuyops.com/download/mobile-coco/${appName}/${fileName}.zip`,
  };
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
function createReport(reqBody) {
  let { appName, buildNum, logs, increment, relativebuildNum } = reqBody;
  if (!relativebuildNum) {
    relativebuildNum = 0;
  }

  var ecFilesText = ecTextOf(logs);
  var outDateDir = dateDir();
  var cmd =
    `java -jar ${path.reportJarPath} \\\n` +
    `--ecFiles=${ecFilesText} \\\n` +
    `--backupDir=${path.backupDir} \\\n` +
    `--buildNum=${buildNum} ` +
    `--reportOutDir=${path.reportDir}/${appName}/${appName}_${buildNum}_${relativebuildNum}_${outDateDir}`;
  if (increment && relativebuildNum > 0) {
    cmd = cmd.concat(` \\\n--relativebuildNum=${relativebuildNum}`);
  }
  console.log(`exec shell ==>\n${cmd}`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: \n${stdout}`);
    //   console.error(`stderr: ${stderr}`);
  });
  console.log('eneeeed========>');
}
function ecTextOf(logs) {
  var ecFilesText = '';
  for (var log of logs) {
    ecFilesText = ecFilesText.concat(`,${log.path}`);
  }
  if (ecFilesText) {
    ecFilesText = ecFilesText.substring(1);
  }
  return ecFilesText;
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
// queryReportList("fxj", 200, 2, 5);

function dateDir() {
  var date = new Date();
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  m = m < 10 ? '0' + m : m;
  var d = date.getDate();
  d = d < 10 ? '0' + d : d;
  var h = date.getHours();
  h = h < 10 ? '0' + h : h;
  var minute = date.getMinutes();
  minute = minute < 10 ? '0' + minute : minute;
  var second = date.getSeconds();
  second = second < 10 ? '0' + second : second;
  return y + m + d + h + minute + second;
}

module.exports = {
  queryLogList,
  queryReportList,
  createReport,
};
