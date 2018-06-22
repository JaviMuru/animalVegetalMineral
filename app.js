const inquirer = require('inquirer');
const fs = require('fs');
const original_db = require('./db.json');
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

async function generateElementQuestions(db, element, userName) {
  let questionsDelimiter = 2;
  let i = 0;
  let questions = db.questions;
  let promises = [];  
  let alt_index = Math.floor(Math.random() * questions.length)
  
  for (const index in questions) {
    promises.push(await quiz(questions[index], index));
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
      getNewElement(db, element, userName);
    })

}

async function getNewElement(db, element, userName) {  
  const userElementPromise = await getUserElement(element);
  const userQuestionPromise = await getUserQuestion(element);
  
  Promise.all([userElementPromise, userQuestionPromise])
    .then(values => {
      const userElement = values[0];
      const userQuestion = values[1];
      if (userElement && userQuestion) {
        writeNewElement(original_db, element, userElement, userQuestion, userName);
      }
    });
}

function getUserElement(element){
  let message = {
    message: `¿En qué ${element} estabas pensando?`,
    type: 'input',
    name: 'userThink'
  };
  return prompt(message)
    .then(response => {      
      if (response) {
        return response.userThink;
      }
    })
}

function writeNewElement(original_db, type, userElement, userQuestion, userName) {
  original_db[`${type}`].questions.push(`¿${userQuestion}?`);
  let indexQuestion = (original_db[`${type}`].questions.length) - 1;
  //Replace correct answers
  let result = {};
  result[`${userElement}`] = {
    user: userName,
    correctAnswers: [0,1,indexQuestion]
  };
  
  original_db[`${type}`].answers.push(result)
  
  //Write to File
  fs.writeFile("./db.json", JSON.stringify(original_db), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("Fichero actulizado");
  })
}

function getUserQuestion(element){
  let message = {
    message: `Introduce la pregunta:`,
    type: 'input',
    name: 'userQuestion'
  };
  return prompt(message)
    .then(response => {
      if (response) {
        return response.userQuestion;
      }
    });
}

//TODO: review code and logic
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
    }
  }
  return;
}

async function quiz(question, index) {
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
    if (userInfo) {
      return {
        db: original_db[`${userInfo.element}`],
        element: userInfo.element,
        user: userInfo.userName
      }
    }
  })
  .then(values => {
    if (values) {
      const db =  values.db;
      const element = values.element;
      const userName = values.user;
      return generateElementQuestions(db, element, userName)
    }
  })
