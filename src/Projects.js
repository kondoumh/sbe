const PROJECT_KEY = "projects"

let projects = []

function initializeProjects() {
  const select = document.querySelector("#projects");
  select.addEventListener("change", e => {
    const project = select.value;
      if (!tabGroup.activateIfViewOpened(sbUrl.LIST_PAGE, project)) {
        localStorage.setItem("projectName", project);
        addTab(sbUrl.LIST_PAGE, true, project);
      }
      select.selectedIndex = 0;
  });
  const data = localStorage.getItem(PROJECT_KEY);
  projects = data ? JSON.parse(data) : [];
  projects.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.text = item;
    select.append(option);
  });
}

function addProject(projectName) {
  if (!projectName || projects.includes(projectName)) {
    return;
  }
  projects.push(projectName);
  projects.sort();
  const select = document.querySelector("#projects");
  select.options.length = 0;
  const top = document.createElement("option");
  top.text = "projects"
  select.append(top);
  select.selectedIndex = 0;
  projects.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.text = item;
    select.append(option);
  });
  localStorage.setItem(PROJECT_KEY, JSON.stringify(projects));
}

module.exports = {
  initializeProjects,
  addProject
}
