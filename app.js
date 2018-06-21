const inquirer = require('inquirer');
const db = require('./db.json');
let prompt = inquirer.createPromptModule();

const initQuestion = [
  {
    message: '¿Queires Jugar a Animal-Vegetal-Mineral?',
    type: 'confirm',
    default: 'true',
    name: 'startGame'
  }
]

const userInfoQuestions = [
  {
    message: 'Introduce tu nombre',
    type: 'input',
    name: 'userName'
  },
  {
    message: '¿En qué tipo de elemento estas pensando?',
    type: 'list',
    name: 'element',
    choices: ['Animal', 'Vegetal', 'Mineral']
  }
]

function initApp() {
  return prompt(initQuestion)
}

async function generateElementQuestions(db, element) {
  let questionsDelimiter = 2;
  let i = 0;
  let questions = db.questions;
  let promises = [];

  for (const index in questions) {
    promises.push(await questionize(questions[index], index));
  }

  Promise.all(promises)
    .then(answers => {      
      answers = answers.filter(answer => answer.answer === true)      
      return findResult(answers, db.answers)
    })
    .then(result => {
      if (result) {
        console.log(`El ${element} que has pensado es: ${result.result}`);
        return;
      }
      prompt({
        message: '¿Queires Jugar a Animal-Vegetal-Mineral?',
        type: 'confirm',
        default: 'true',
        name: 'startGame'
      })
      .then()
      
    })

}

function findResult(answers, db_answers) {
  let resultFinded = false;
  for (key in db_answers) {
    answers.forEach(answer => {      
      if (db_answers[key].correctAnswers.includes(parseInt(answer.questionIndex))) {        
        resultFinded = true;
      } else {
        resultFinded = false;
      }
    });   
    if (resultFinded) {
      return {
        result: key,
        user: db_answers[key].user
      }
    } else {

    }
  }
  return;
}

async function questionize(question, index) {
  return prompt(  {
    message: `${question}`,
    type: 'confirm',
    name: 'answer',
  })
  .then(answer => {
    return {
      answer: answer.answer,
      questionIndex: index
    }
  });
}

initApp()
  .then(startGame => {
    if (!startGame.startGame) {
      console.log('Juego cancelado :(');
      return;
    }
    return prompt(userInfoQuestions)
  })
  .then(userInfo => {    
    return {
      db: db[`${userInfo.element}`],
      element: userInfo.element
    }
  })
  .then(values => {
    const db =  values.db;
    const element = values.element;
    return generateElementQuestions(db, element)
  })
