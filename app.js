const inquirer = require('inquirer');
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

async function generateElementQuestions(db, element) {
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
      getNewElement(db, element);
    })

}

async function getNewElement(db, element) {  
  const userElementPromise = await getUserElement(element);
  const userQuestionPromise = await getUserQuestion(element);
  
  Promise.all([userElementPromise, userQuestionPromise])
    .then(values => {
      const userElement = values[0];
      const userQuestion = values[1];   
      if (userElement && userQuestion) {
        writeNewElement(original_db, element, userElement, userQuestion);
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

function writeNewElement(original_db, type, userElement, userQuestion) {
  original_db[`${type}`].questions.push(`¿${userQuestion}?`);
  let indexQuestion = (original_db[`${type}`].questions.length) - 1;

  userElement = {
    user: 'Jacinto',
    correctAnswers: [0,1,indexQuestion]
  }
  original_db[`${type}`].answers.push(userElement)
  console.log(original_db[`${type}`].answers);
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
        element: userInfo.element
      }
    }
  })
  .then(values => {
    if (values) {
      const db =  values.db;
      const element = values.element;
      return generateElementQuestions(db, element)
    }
  })
