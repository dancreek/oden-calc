let leftValue = null;
let rightValue = null;
let pendingOperation = null;
let errorState = false;
let startingEntryProcess = true; 
let rightValueReady = false; //Ready to enter the right hand value

//Using a custom setter here guaranteees that the display is always up-to-date when we change the displayValue
let displayValue = {
    _current: '0',
    get current() {
      return this._current;
    },
  
    set current(value) {
      this._current = value;
      updateDisplay();
    }
};

const DEFAULT_START_VALUE = '0';
const MAX_CHARACTERS = 12;
const mainDisplay = document.querySelector('.display.main');
const secondaryDisplay = document.querySelector('.display.secondary');

connectInterface();

function connectInterface() {
    const allButtons = document.querySelectorAll('.button');
    allButtons.forEach(button => {
        button.addEventListener('mousedown', function () {this.classList.add('pressed')});
        button.addEventListener('mouseup', function () {this.classList.remove('pressed')});
    });

    const numberButtons = document.querySelectorAll('.button.number');
    numberButtons.forEach((button) => {
        button.addEventListener('click', numberButtonTap);
        button.addEventListener
    });

    const operatorButtons = document.querySelectorAll('.button.operator');
    operatorButtons.forEach((button) => {
        button.addEventListener('click', operatorButtonTap);
    });

    const utilityButtons = document.querySelectorAll('.button.utility');
    utilityButtons.forEach((button) => {
        button.addEventListener('click', utilityButtonTap);
    });

    const equalsButton = document.querySelector('.equals');
    equalsButton.addEventListener('click', equals);

    window.addEventListener('keydown', keypress);

    resetCalculator();
}

function numberButtonTap (e) {
    if (errorState) resetCalculator();
    const existingEntry = (startingEntryProcess) ? '' : displayValue.current; //clear the screen if this is the first character of an entry
    if (existingEntry.length >= MAX_CHARACTERS) return; //limit max length of entry
    if (this.dataset.button === '.' && existingEntry.search(/\./) > -1 ) return; //check for an existing decimal

    let newEntry = existingEntry + this.dataset.button;
    if (newEntry[0] === '.') newEntry = '0' + newEntry; //add a 0 if there is a leading '.'
    if (newEntry.length > 1 && newEntry[0] === '0' && newEntry[1] !== '.') newEntry = newEntry.slice(1); //eliminate leading 0's
    startingEntryProcess = false;
    displayValue.current = newEntry;
    
    console.log(newEntry);
}

function operatorButtonTap (e) {
    if(rightValueReady && !startingEntryProcess) equals(); //If there is already an operator and the user has entered something for the right value, evaluate the operation before setting the new operator
    if(errorState) return; //dont respond if we are in an error state
    leftValue = displayValue.current; 
    pendingOperation = this.dataset.button;
    startingEntryProcess = true; //we are ready to accept a new entry now
    rightValueReady = true; //the next entry will be the right value
    deselectAllOperators(); 
    this.classList.add('active'); //Highlight the current operation
    updateDisplay();
}

function equals() {
    if(!pendingOperation || errorState) return; //Exit if we are in an error state or there isnt enough to evaluate
    if(rightValueReady) { //assign the current entry to the correct side of teh equasion before evaluating
        rightValue = displayValue.current;
    } else {
        leftValue = displayValue.current; //This enables repeated tapping of the = button to continue repeating and compounding the result. This is the normal behavior of most calculators
    }

    const result = operate(pendingOperation, leftValue, rightValue);

    startingEntryProcess = true; //After a calculation, make us ready to accept a new left entry.
    rightValueReady = false;
    displayValue.current = `${result}`; //make sure we are storing as a string 
    errorState = (Number.isNaN(Number(result))); //check for an error result and enter error state if necessary
    deselectAllOperators();
}

function utilityButtonTap (e) {
    console.log("Utility: " + this.dataset.button);
    switch(this.dataset.button) {
        case 'ac':
            resetCalculator();
            break;
        case 'c':
            clearCurrentEntry();
            break;
        case 'negative':
            if (errorState) break; //Dont respond if in an error state
            negativeNumber();
        default:
            break;
    }
}

function keypress(e) {
    console.log(e.key);
}

function resetCalculator() {
    leftValue = null;
    rightValue = null;
    pendingOperation = null;
    startingEntryProcess = true;
    rightValueReady = false;
    errorState = false;
    displayValue.current = DEFAULT_START_VALUE;
    deselectAllOperators();
}

function clearCurrentEntry() {
    if(startingEntryProcess) {
        resetCalculator(); //If we are at the beginning of an entry then there is nothing to clear so just completely reset
    } else {
        startingEntryProcess = true;
        displayValue.current = DEFAULT_START_VALUE;
    }
}

function negativeNumber() {
    if (displayValue.current[0] === '-') {
        displayValue.current = displayValue.current.slice(1);
    } else {
        startingEntryProcess = false;
        displayValue.current = '-' + displayValue.current;
    }
}

function updateDisplay() {
    mainDisplay.textContent = displayValue.current;

    //Secondary disaplay logic
    if (!leftValue || (!rightValueReady && !startingEntryProcess)) secondaryDisplay.textContent = ''; //If we are entering the left value entry, show nothing
    else secondaryDisplay.textContent = (rightValueReady) ? `${leftValue} ${pendingOperation}`:`${leftValue} ${pendingOperation} ${rightValue} =`; //else show what we do have
}

function deselectAllOperators() {
    const activeButtons = document.querySelectorAll('.active').forEach(item => {item.classList.remove('active')});
}

function operate(operation, left, right) {
    //convert to numbers & check for errors
    const x = parseFloat(left);
    const y = parseFloat(right);
    if (isNaN(x) || isNaN(y)) return "Error";

    //Run the calculations and store the result to return
    let result;
    switch(operation) {
        case "+":
            result = add(x, y);
            break;
        case "-":
            result = subtract(x,y);
            break;
        case "*":
            result = multiply(x,y);
            break;
        case "/":
            if (y === 0) {
                result = "Don't be silly"; //Check for division by 0
                break;
            }
            result = divide(x,y);
            break;
        default:
            result = "Error"  //Catch any thing else
            break;
    }
    return roundToTen(result); //limit the length of the result and clean up floating point math issues
}

//Math functions
function add(x, y) {
    return x + y;
}

function subtract(x, y) {
    return x - y;
}

function multiply(x, y) {
    return x * y;
}

function divide(x, y) {
    return x / y;
}

function roundToTen(num) {    
    return +(Math.round(num + "e+10")  + "e-10"); //limit the length of the result and solve for floating point math errors
}

/*
Remaining issues
*negative button results in leading 0 in some cases
*let secondary display compound
*properly update secondary line after an =
*/