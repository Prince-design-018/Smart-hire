const form = document.getElementById('resumeForm');
const feedbackBox = document.getElementById('feedback');
const feedbackText = document.getElementById('feedbackText');
const jobMatchesList = document.getElementById('jobMatches');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('resume');
  const file = fileInput.files[0];
  if (!file) return alert('Please upload a resume first.');

  const formData = new FormData();
  formData.append('resume', file);

  feedbackBox.classList.remove('d-none');
  feedbackText.innerText = 'Analyzing your resume... please wait ⏳';
  jobMatchesList.innerHTML = '';

  try {
    const response = await fetch('http://localhost:3000/analyze', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    feedbackText.innerText = data.feedback;

    if (data.jobMatches && data.jobMatches.length) {
      data.jobMatches.forEach(job => {
        const li = document.createElement('li');
        li.textContent = job;
        jobMatchesList.appendChild(li);
      });
    }
  } catch (error) {
    console.error(error);
    feedbackText.innerText = '❌ Failed to analyze resume. Please try again.';
  }
});
