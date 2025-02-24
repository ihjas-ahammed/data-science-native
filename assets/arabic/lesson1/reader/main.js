'use strict';

let currentLessonIndex = 0;
let lessonData = [];


const storageKey = `${window.location.pathname}_lessonProgress`;

const lessonContent = document.querySelector('.lesson-content');
const arabicText = document.getElementById('arabicText');
const englishText = document.getElementById('englishText');
const wordTableBody = document.getElementById('wordTableBody');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// ------------
async function fetchLessonData() {
    try {
        const response = await fetch('lesson.json');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        lessonData = await response.json();
        loadProgress(); // Load saved progress from local storage (if any)
        displayLesson(currentLessonIndex);
        updateNavigationButtons();
        updateProgress();
    } catch (error) {
        console.error('Error loading lesson data:', error);
        lessonContent.innerHTML =
            `<p class="error">Error loading lesson data. Please try again later.</p>`;
    }
}

function displayLesson(index) {
    const lesson = lessonData[index];
    if (!lesson) return;
    lessonContent.classList.add('fade');
    setTimeout(() => {
        arabicText.textContent = lesson.sentence;
        englishText.textContent = lesson.meaning;

        wordTableBody.innerHTML = lesson.words
            .map(word => `
                <tr>
                    <td dir="rtl">${word.word}</td>
                    <td>${word.meaning}</td>
                </tr>
            `)
            .join('');

        updateProgress();
        lessonContent.classList.remove('fade');
    }, 300);
}

function updateProgress() {
    const progress = ((currentLessonIndex + 1) / lessonData.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${currentLessonIndex + 1}/${lessonData.length}`;
}

function previousLesson() {
    if (currentLessonIndex > 0) {
        currentLessonIndex--;
        displayLesson(currentLessonIndex);
        updateNavigationButtons();
        saveProgress();
    }
}

function nextLesson() {
    if (currentLessonIndex < lessonData.length - 1) {
        currentLessonIndex++;
        displayLesson(currentLessonIndex);
        updateNavigationButtons();
        saveProgress();
    }
}

function updateNavigationButtons() {
    prevBtn.disabled = currentLessonIndex === 0;
    nextBtn.disabled = currentLessonIndex === lessonData.length - 1;
}

prevBtn.addEventListener('click', previousLesson);
nextBtn.addEventListener('click', nextLesson);

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        previousLesson();
    } else if (event.key === 'ArrowRight') {
        nextLesson();
    }
});

let touchStartX = 0;
document.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].screenX;
});
document.addEventListener('touchend', event => {
    const touchEndX = event.changedTouches[0].screenX;
    const swipeThreshold = 50;
    const swipeLength = touchEndX - touchStartX;

    if (Math.abs(swipeLength) > swipeThreshold) {
        swipeLength > 0 ? previousLesson() : nextLesson();
    }
});

function adjustArabicTextSize() {
    const containerHeight = lessonContent.clientHeight;
    let fontSize = parseInt(window.getComputedStyle(arabicText).fontSize, 10);
    while (arabicText.scrollHeight > containerHeight * 0.4 && fontSize > 16) {
        fontSize--;
        arabicText.style.fontSize = `${fontSize}px`;
    }
}
const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        if (entry.target === arabicText) {
            adjustArabicTextSize();
        }
    }
});
resizeObserver.observe(arabicText);

window.addEventListener(
    'error',
    event => {
        if (event.target.tagName === 'IMG') {
            event.target.style.display = 'none';
            const errorText = document.createElement('span');
            errorText.className = 'error-text';
            errorText.textContent = 'Image failed to load';
            event.target.parentNode.appendChild(errorText);
        }
    },
    true
);

function saveProgress() {
    localStorage.setItem(storageKey, currentLessonIndex);
}

function loadProgress() {
    const savedProgress = localStorage.getItem(storageKey);
    if (savedProgress !== null) {
        currentLessonIndex = parseInt(savedProgress, 10);
    }
}


window.addEventListener('load', fetchLessonData);
window.addEventListener('beforeunload', saveProgress);
