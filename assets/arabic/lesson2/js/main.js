'use strict';

let currentLevel = 1;
let currentQuestion = 0;
let score = 0;
let lives = 3;
let progress = {}; // progress per level, e.g. {1: 50, 2: 100, ...}
let answeredQuestions = new Set();
let levels = {};     // English levels
let levelsAr = {};   // Arabic levels
let currentTab = 'english';
let currentQuestionShuffledData = {};

const storageKey = `${window.location.pathname}_arabicLiteratureProgress`;

async function fetchLevels() {
    try {
        const [englishResponse, arabicResponse] = await Promise.all([
            fetch('js/levels.json'),
            fetch('js/levels-ar.json')
        ]);
        levels = await englishResponse.json();
        levelsAr = await arabicResponse.json();

        Object.keys(levels).forEach(level => {
            shuffleArray(levels[level]);
        });
        Object.keys(levelsAr).forEach(level => {
            shuffleArray(levelsAr[level]);
        });

        initializeLevelSelectForLang('english');
        initializeLevelSelectForLang('arabic');
        updateBackButton();
    } catch (error) {
        console.error('Error loading levels:', error);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateBackButton() {
    const backButton = document.getElementById('backButton');
    const isHome = (currentTab === 'english' && document.querySelector('.level-select').style.display !== 'none') ||
                   (currentTab === 'arabic' && document.querySelector('.level-select-ar').style.display !== 'none') ||
                   currentTab === 'reader';
    backButton.disabled = isHome;
    backButton.style.opacity = isHome ? '0.5' : '1';
    backButton.onclick = isHome ? null : returnToMainMenu;
}

function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[onclick="switchTab('${tabName}')"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    updateBackButton();
}

function loadProgress() {
    const savedProgress = localStorage.getItem(storageKey);
    return savedProgress ? JSON.parse(savedProgress) : {
        levelProgress: {},
        levelProgressAr: {},
        totalScore: 0
    };
}

function saveProgress() {
    const progressData = {
        levelProgress: {},
        levelProgressAr: {},
        totalScore: score
    };

    Object.keys(levels).forEach(level => {
        progressData.levelProgress[level] = {
            completed: answeredQuestions.size === levels[level]?.length,
            progress: progress[level] || 0
        };
    });
    Object.keys(levelsAr).forEach(level => {
        progressData.levelProgressAr[level] = {
            completed: answeredQuestions.size === levelsAr[level]?.length,
            progress: progress[level] || 0
        };
    });

    localStorage.setItem(storageKey, JSON.stringify(progressData));
}

function initializeLevelSelectForLang(lang) {
    const container = document.querySelector(lang === 'english' ? '.level-select' : '.level-select-ar');
    const savedProgress = loadProgress();
    const levelsData = lang === 'english' ? levels : levelsAr;
    const getDesc = lang === 'english' ? getLevelDescription : getLevelDescriptionAr;
    const onclickFn = lang === 'english' ? 'startLevel' : 'startLevelAr';

    try {
        container.innerHTML = Object.keys(levelsData).map(level => `
            <div class="level-card" onclick="${onclickFn}(${level})">
                <div class="level-icon">📚</div>
                <h3>${lang === 'english' ? `Level ${level}` : `المستوى ${level}`}</h3>
                <p>${getDesc(level)}</p>
                <div class="level-progress" style="width: ${savedProgress[lang === 'english' ? 'levelProgress' : 'levelProgressAr'][level]?.progress || 0}%"></div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = Object.keys(levelsData).map(level => `
            <div class="level-card" onclick="${onclickFn}(${level})">
                <div class="level-icon">📚</div>
                <h3>${lang === 'english' ? `Level ${level}` : `المستوى ${level}`}</h3>
                <p>${getDesc(level)}</p>
                <div class="level-progress" style="width: 0%"></div>
            </div>
        `).join('');
    }
}

function getLevelDescription(level) {
    const descriptions = {
        1: "Basic Comprehension",
        2: "Word Meaning",
        3: "Inference and Deeper Understanding",
        4: "Advanced Vocabulary and Literary Analysis"
    };
    return descriptions[level] || `Level ${level}`;
}

function getLevelDescriptionAr(level) {
    const descriptions = {
        1: "مقدمة عن طه حسين",
        2: "المفردات العربية",
        3: "المواضيع الأدبية",
        4: "التحليل المتقدم"
    };
    return descriptions[level] || `المستوى ${level}`;
}

function shuffleQuestions() {
    const currentQuestions = currentTab === 'english' ? levels[currentLevel] : levelsAr[currentLevel];
    shuffleArray(currentQuestions); // Randomize order
    currentQuestion = 0;
    showCurrentQuestion();
}

function startLevelForLang(level, lang) {
    currentLevel = level;
    currentQuestion = 0;
    answeredQuestions.clear();
    lives = 3;
    progress[level] = 0;
    currentQuestionShuffledData = {};

    if (lang === 'english') {
        document.querySelector('.level-select').style.display = 'none';
        document.getElementById('question-container').style.display = 'block';
    } else {
        document.querySelector('.level-select-ar').style.display = 'none';
        document.getElementById('question-container-ar').style.display = 'block';
    }
    shuffleQuestions();
    updateUI();
    updateBackButton();
}

function startLevel(level) {
    startLevelForLang(level, 'english');
}
function startLevelAr(level) {
    startLevelForLang(level, 'arabic');
}

function restartLevel() {
    currentTab === 'english' ? startLevel(currentLevel) : startLevelAr(currentLevel);
}

function updateUI() {
    document.querySelector('.score').textContent = score;
    const progressFill = document.querySelector('.progress-fill');
    progressFill.style.width = `${progress[currentLevel] || 0}%`;
    progressFill.setAttribute('data-level', currentLevel);
    updateLives();
    updateNavButtons();
}

function updateLives() {
    const heartsContainer = document.querySelector('.lives');
    heartsContainer.innerHTML = '❤️'.repeat(lives);
}

function showCurrentQuestion() {
    const currentQuestions = currentTab === 'english' ? levels[currentLevel] : levelsAr[currentLevel];
    const question = currentQuestions[currentQuestion];
    const container = document.querySelector(
        currentTab === 'english' ? '#question-container' : '#question-container-ar'
    );
    const questionElement = container.querySelector('.question');
    const optionsContainer = container.querySelector('.options');

    if (currentTab === 'english') {
        questionElement.innerHTML = question.arabic ?
            `<div class="arabic-text">${question.arabic}</div>${question.question}` :
            question.question;
    } else {
        questionElement.innerHTML = question.english ?
            `<div class="english-text">${question.english}</div>${question.question}` :
            question.question;
    }

    if (!currentQuestionShuffledData[currentQuestion]) {
        const originalOptions = question.options;
        const shuffledOptions = shuffleArray([...originalOptions]);
        const originalCorrectOption = originalOptions[question.correct];
        const newCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);
        currentQuestionShuffledData[currentQuestion] = { options: shuffledOptions, correct: newCorrectIndex };
    }
    const shuffledData = currentQuestionShuffledData[currentQuestion];

    optionsContainer.innerHTML = shuffledData.options
        .map((option, index) => `
            <div class="option ${answeredQuestions.has(currentQuestion) && index === shuffledData.correct ? 'correct' : ''}" 
                 onclick="checkAnswer(${index})">
                ${option}
            </div>
        `).join('');
    updateNavButtons();
}

function updateNavButtons() {
    const isEnglish = currentTab === 'english';
    const prevBtn = document.getElementById(isEnglish ? 'prevBtn' : 'prevBtn-ar');
    const nextBtn = document.getElementById(isEnglish ? 'nextBtn' : 'nextBtn-ar');
    const currentQuestions = isEnglish ? levels[currentLevel] : levelsAr[currentLevel];

    prevBtn.disabled = currentQuestion === 0;
    nextBtn.disabled = currentQuestion === currentQuestions.length - 1;
}

function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showCurrentQuestion();
    }
}

function nextQuestion() {
    const currentQuestions = currentTab === 'english' ? levels[currentLevel] : levelsAr[currentLevel];
    if (currentQuestion < currentQuestions.length - 1) {
        currentQuestion++;
        showCurrentQuestion();
    }
}

function checkAnswer(selectedIndex) {
    if (answeredQuestions.has(currentQuestion)) return;

    const currentQuestions = currentTab === 'english' ? levels[currentLevel] : levelsAr[currentLevel];
    const question = currentQuestions[currentQuestion];
    const container = currentTab === 'english' ?
        document.getElementById('question-container') :
        document.getElementById('question-container-ar');
    const options = container.querySelectorAll('.option');

    let shuffledData = currentQuestionShuffledData[currentQuestion];
    if (!shuffledData) {
        const originalOptions = question.options;
        const shuffledOptions = shuffleArray([...originalOptions]);
        const originalCorrectOption = originalOptions[question.correct];
        const newCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);
        shuffledData = { options: shuffledOptions, correct: newCorrectIndex };
        currentQuestionShuffledData[currentQuestion] = shuffledData;
    }

    if (selectedIndex === shuffledData.correct) {
        options[selectedIndex].classList.add('correct');
        score += 10;
        answeredQuestions.add(currentQuestion);
        progress[currentLevel] = (answeredQuestions.size / currentQuestions.length) * 100;
    } else {
        options[selectedIndex].classList.add('wrong');
        options[shuffledData.correct].classList.add('correct');
        lives--;
        if (lives === 0) {
            gameOver();
            return;
        }
    }

    updateUI();
    saveProgress();
}

function gameOver() {
    const container = currentTab === 'english' ?
        document.getElementById('question-container') :
        document.getElementById('question-container-ar');
    container.innerHTML = `
        <div class="game-over">
            <h2>${currentTab === 'english' ? 'Game Over!' : 'انتهت اللعبة!'}</h2>
            <p>${currentTab === 'english' ? 'Final Score: ' : 'النتيجة النهائية: '}${score}</p>
            <div class="nav-buttons">
                <button class="nav-btn" onclick="window.location = window.location">
                    ${currentTab === 'english' ? 'Main Menu' : 'القائمة الرئيسية'}
                </button>
            </div>
        </div>
    `;
    updateBackButton();
}

function returnToMainMenu() {
    if (currentTab === 'english') {
        document.querySelector('.level-select').style.display = 'grid';
        document.getElementById('question-container').style.display = 'none';
        initializeLevelSelectForLang('english');
    } else {
        document.querySelector('.level-select-ar').style.display = 'grid';
        document.getElementById('question-container-ar').style.display = 'none';
        initializeLevelSelectForLang('arabic');
    }
    updateBackButton();
}

function fixReaderHeight() {
    const readerTab = document.getElementById("reader-tab");
    const mainContent = document.querySelector(".main-content");
    if (readerTab && mainContent) {
        readerTab.style.height = "100%";
        setTimeout(() => readerTab.style.height = (mainContent.clientHeight - 30) + "px", 100);
    }
}

window.addEventListener("resize", fixReaderHeight);

document.addEventListener('DOMContentLoaded', () => {
    fetchLevels();
    switchTab('english');

    document.getElementById('prevBtn').addEventListener('click', previousQuestion);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('prevBtn-ar').addEventListener('click', previousQuestion);
    document.getElementById('nextBtn-ar').addEventListener('click', nextQuestion);

    document.getElementById('shuffleBtn').addEventListener('click', shuffleQuestions);
    document.getElementById('shuffleBtn-ar').addEventListener('click', shuffleQuestions);

    fixReaderHeight();
});
