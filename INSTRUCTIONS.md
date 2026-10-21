# Project Instructions: Inviting Participation

Your final project for the course centers on **inviting participation** -- building interfaces that enable participation and collaboration by inviting members of a community to create, annotate, manipulate, or contribute to a spatial dataset in some way. The project should build upon concepts learned throughout the semester, incorporate a significant amount of interactivity, and store and recall data so that participants and downstream users can benefit from the shared input.

## Guidance

* **Project continuity:** You may extend your story map or your decision support tool, as long as you have a realistic addition of functionality that invites user engagement. You may also choose to start a new project from scratch.
* **Team policy:** Projects should be done individually unless you consult with the instructor first about group work. Group projects will be expected to engage with a wider scope and greater technical difficulty.
* **Keep large data files out of your repository.** GitHub will block files larger than ~100MB. Talk to your instructors if you need guidance on where to host large data files.
* **Simplify your geospatial data** appropriately (i.e., right-sized for your use case) to reduce file size and improve performance.
* **Start simple.** Focus on getting the core participation interaction and data flow working before adding layers of visual or algorithmic complexity.

## Timeline

We will allocate **Weeks 9-14** (six weeks) of the semester to this project. To help keep you on track, here are the milestone check-ins:

* **Week 10**: Project Proposal due (committed directly into your `README.md`)
* **Week 11**: Initial Wireframes due (posted in your Pull Request description)
* **Week 13**: Plan for Completion due (posted in your Pull Request description)
* **Week 14**: Project Presentations & Final Submission

> **Tip:** Open your Pull Request early (by Week 10 or 11 as a Draft PR) into the class repository so you can post your wireframes and completion plan there and receive iterative feedback before final submission.

---

### Step 1: Define the problem, participants, and audience

Before writing code, clearly define who you are inviting to participate and what happens with their contributions. Public participation tools can operate as **one-sided** communities (e.g., transit riders sharing real-time vehicle info to help fellow riders) or **two-sided** communities (e.g., residents reporting potholes or suggesting bike stations for city planners to review).

To guide your project, complete the following statements in your project's `README.md`:

1. **The specific participants/community I want to engage are...**
2. **The contributions/input I am inviting them to make are...**
3. **The participants will benefit from contributing their input by...**
4. **The users that will use the collected data are...** *(these could be the same or different from the participants contributing the input)*
5. **The collected data will benefit those users by...** *(optional, if the users of the data are different from the participants contributing the input)*

When defining your participants and users, be more specific than "the general public." Refer to the [18F Method Card on Personas](https://guides.18f.gov/methods/decide/personas/) or the Digital.gov article on [Improving Customer Experience with Digital Personas](https://digital.gov/2017/06/20/improving-customer-experience-with-digital-personas/) for guidance on identifying specific user needs and scenarios.

Whatever data you use (both reference datasets and participant-generated data), **be sure to include citations somewhere in your app interface**.

### Step 2: Plan the interface and completion roadmap

Take time to map out the user experience and your implementation plan:

* **Initial Wireframes (due Week 11):** Create sketches or mockups showing what your interface and contribution interaction will look like (e.g., how someone clicks the map, fills out a report, or submits an idea). Post your wireframes in your Pull Request description. You are also welcome to save wireframe images or notes inside a `docs/` folder in your repository.
* **Plan for Completion (due Week 13):** Break down the remaining work into discrete tasks and assign a realistic timeline to finish before presentations. Post your completion plan in your Pull Request description. You can also track issues using tools like GitHub Projects or GitHub Issues.

### Step 3: Build the application (Suggested Milestones)

You have flexibility in your technical stack: you may build using Vanilla JS or adopt modern build tools and reactive frameworks like Vite + Vue (introduced in Weeks 10-12). You may store contributed data in a backend-as-a-service (BaaS) like Cloud Firestore so multiple users can sync and share data in real time, or use another persistence/export mechanism if justified by your project's use case.

Here is a suggested workflow to guide development:

* **Milestone 1: The Foundation & Context.** Set up your base page structure and initialize your map/interface (or start from your existing Story Map or Decision Support Tool). Fetch and display any reference layers (e.g., existing parks, transit lines, or neighborhood boundaries) that provide context for your participants.
* **Milestone 2: The Participation Flow.** Build the interactive UI elements that allow participants to contribute data (e.g., map click event listeners to place a marker, an HTML form to capture details, or drawing controls). Provide immediate feedback in the UI when the user contributes (such as form validation and a confirmation message).
* **Milestone 3: Data Persistence & Sharing.** Connect your application to a persistence layer (such as Cloud Firestore with `addDoc` to submit and `getDocs` or `onSnapshot` to read and subscribe). Ensure that submitted contributions persist across browser reloads and that participants and/or downstream users can see and interact with the collected data.

### Step 4: Check your code

* **Code Quality:** Ensure your JavaScript and CSS code are properly linted using ESLint (`npm run js-lint` or `npx eslint --color .`) and Stylelint (`npm run css-lint` or `npx stylelint --color "./**/*.css"`).
* **Responsiveness:** Test that your interface functions effectively on both desktop and mobile browser window sizes.
* **Accessibility (a11y):** Verify that your tool is accessible. Check color contrast ratios, ensure form controls and interactive elements can be navigated via keyboard, and test with browser tools like Axe DevTools.

### Step 5: Submit your project

Commit your code and push it to the `main` branch of your GitHub repository. Ensure GitHub Pages is deployed, and submit (or update) your pull request into the original repository in the class organization.

#### Submission Checklist

- [ ] Pushed latest code to the `main` branch of your repository
- [ ] Updated the `README.md` file with a description of your project, completed guiding statements, data citations, and technical details
- [ ] Added wireframes to the Pull Request description (and optionally in a `docs/` folder)
- [ ] Added plan for completion to the Pull Request description
- [ ] Linted JS and CSS code
- [ ] Verified a11y of your site
- [ ] Turned on GitHub Pages for the repository and verified that your site works when deployed
- [ ] Submitted a pull request to the original repository in the class organization
- [ ] In the PR **title**, included your name at least (and partner names if completing an approved group project)
- [ ] In the PR **description**, included your guiding statements, wireframes, plan for completion, and a brief description of the tool
