// Reference section
// document.addEventListener('DOMContentLoaded', function() {
//     // Create a new section for references
//     const referencesSection = document.createElement('section');
//     referencesSection.classList.add('references');  // Add a class for styling
//     referencesSection.innerHTML = `
//         <h2>References</h2>
//         <ul>
//             <li><a href="https://www.flaticon.com/free-icons/blue-whale" title="blue whale icons">Blue whale icons created by Freepik - Flaticon</a></li>
//             <li><a href="https://www.anotherexample.com" target="_blank">Another Example</a></li>
//             <li><a href="https://www.yetanotherexample.com" target="_blank">Yet Another Example</a></li>
//         </ul>
//     `;

//     // Append the references section to the page
//     const referenceContainer = document.getElementById('references-section');
//     referenceContainer.appendChild(referencesSection);
// });

// script.js
document.addEventListener('DOMContentLoaded', function () {
    const logo = document.getElementById('logo');
    
    // When the logo is clicked, navigate to the home page (you can change this URL)
    logo.addEventListener('click', function() {
        window.location.href = 'index.html'; // Replace with your homepage URL
    });

    // Handle tab clicks
    const tabs = document.querySelectorAll('.tabs a');
    tabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent the default link behavior
            
            // Highlight the active tab
            tabs.forEach(link => link.classList.remove('active'));
            tab.classList.add('active');

            // You can add specific content changes based on which tab is clicked
            const tabId = tab.getAttribute('href').substring(1);
            alert(`You clicked on ${tabId}`);
        });
    });
});

