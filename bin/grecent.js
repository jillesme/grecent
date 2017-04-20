#! /usr/bin/env node
const exec = require('child_process').exec;
const inquirer = require('inquirer');

function trim(str) {
  return str.replace(/\s/g, '');
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (!err && !stderr) {
        resolve(stdout);
      } else {
        reject(err, stderr);
      }
    })
  });
}

function getCurrentBranch() {
  return new Promise((resolve, reject) => {
    run('git rev-parse --abbrev-ref HEAD')
      .then(branch => resolve(branch))
      .catch(error => {
        console.log('Not in a git repository');
        process.exit(1);
      });
  });
}

function getRecentBranches() {
 return run('git for-each-ref --sort=-committerdate refs/heads')
}

function listBranches([current, allBranches]) {
  const branchRegex = /refs\/heads\/(.+$)/gi;
  const branchList = allBranches
    .split('\n')
    .slice(0, -1)
    .map((line, i) => {
      // removes /refs/heads from string
      return line.match(branchRegex)[0].substr(11);
    })
    .filter(branch => branch !== trim(current));

  if (!branchList.length) {
    console.log('There\'s only one branch in this repository');
    return process.exit(1);
  }
  return branchList;
}

function promptUser(branches) {
  return inquirer.prompt({
    type: 'list',
    message: 'Choose branch:',
    name: 'branch',
    pageSize: branches.length > 10 ? 10 : branches.length,
    choices: branches
  });
}

function switchBranch({ branch }) {
  exec('git checkout ' + branch);
}

Promise.all([getCurrentBranch(), getRecentBranches()])
  .then(listBranches)
  .then(promptUser)
  .then(({ branch }) => exec(`git checkout ${branch}`));

