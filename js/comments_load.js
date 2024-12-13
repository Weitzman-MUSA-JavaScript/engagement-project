const commentsData = [
  {
    'projectId': 'project_1',
    'name': 'Mr. Nicholas Yoder',
    'time': '2023-10',
    'content': 'Mission must their north family.',
  },
  {
    'projectId': 'project_3',
    'name': 'Matthew Ford',
    'time': '2023-03',
    'content': 'Soon return growth section build.',
  },
  {
    'projectId': 'project_1',
    'name': 'Melissa Hamilton',
    'time': '2024-02',
    'content': 'Test speak happen no the.',
  },
  {
    'projectId': 'project_1',
    'name': 'Vicki Cummings',
    'time': '2023-03',
    'content': 'Yeah thank stand card institution big stand trouble.',
  },
  {
    'projectId': 'project_1',
    'name': 'Emily Dennis',
    'time': '2023-04',
    'content': 'Resource travel behavior receive will glass tell.',
  },
  {
    'projectId': 'project_2',
    'name': 'Randy Ballard',
    'time': '2024-04',
    'content': 'Until common down ahead.',
  },
  {
    'projectId': 'project_4',
    'name': 'Patrick Burton',
    'time': '2023-01',
    'content': 'Gun blue task suddenly defense thus.',
  },
  {
    'projectId': 'project_2',
    'name': 'James Mejia',
    'time': '2023-07',
    'content': 'Under fast service opportunity management.',
  },
  {
    'projectId': 'project_2',
    'name': 'Megan Hayden',
    'time': '2023-02',
    'content': 'Carry prevent program prevent science right buy.',
  },
  {
    'projectId': 'project_1',
    'name': 'Ann Harding',
    'time': '2023-01',
    'content': 'Read pick compare visit arm member.',
  },
  {
    'projectId': 'project_1',
    'name': 'Todd Welch',
    'time': '2023-11',
    'content': 'Computer office single also contain per can.',
  },
  {
    'projectId': 'project_4',
    'name': 'Anthony Price',
    'time': '2022-12',
    'content': 'Its spend few world short pass.',
  },
  {
    'projectId': 'project_3',
    'name': 'Mary Small',
    'time': '2023-09',
    'content': 'Letter maybe fly meet Democrat west relationship case.',
  },
  {
    'projectId': 'project_2',
    'name': 'Joanna Herrera',
    'time': '2024-10',
    'content': 'Forget thus exist strong ten.',
  },
  {
    'projectId': 'project_1',
    'name': 'Jessica Boyle',
    'time': '2024-04',
    'content': 'Ball successful well idea top.',
  },
  {
    'projectId': 'project_2',
    'name': 'Joel Vasquez',
    'time': '2024-10',
    'content': 'Course memory site today between development environment.',
  },
  {
    'projectId': 'project_2',
    'name': 'Ruth Orr',
    'time': '2023-08',
    'content': 'Start manager current note news cold thus.',
  },
  {
    'projectId': 'project_1',
    'name': 'Sonya Herring',
    'time': '2024-05',
    'content': 'Part audience sell family begin citizen.',
  },
  {
    'projectId': 'project_1',
    'name': 'Sarah White',
    'time': '2023-02',
    'content': 'Help bad itself return.',
  },
  {
    'projectId': 'project_3',
    'name': 'Jeffery Esparza',
    'time': '2023-05',
    'content': 'Feeling night media newspaper act national learn entire.',
  },
  {
    'projectId': 'project_1',
    'name': 'Katherine Williams',
    'time': '2023-06',
    'content': 'Ground behavior century food five color himself.',
  },
  {
    'projectId': 'project_1',
    'name': 'Michael Bond',
    'time': '2024-08',
    'content': 'Example father nature outside model hold.',
  },
  {
    'projectId': 'project_1',
    'name': 'Tommy Bryant',
    'time': '2023-07',
    'content': 'Already news interview decide than call series class.',
  },
  {
    'projectId': 'project_1',
    'name': 'Megan Peterson DVM',
    'time': '2024-11',
    'content': 'Although protect debate quality.',
  },
  {
    'projectId': 'project_3',
    'name': 'Matthew Tucker',
    'time': '2023-09',
    'content': 'Half white stay old law pay training international.',
  },
  {
    'projectId': 'project_3',
    'name': 'Scott Wong',
    'time': '2024-07',
    'content': 'Production left outside themselves one and college.',
  },
  {
    'projectId': 'project_3',
    'name': 'Wayne Jones',
    'time': '2024-01',
    'content': 'Walk bar attorney fund pressure send.',
  },
  {
    'projectId': 'project_2',
    'name': 'Matthew Montgomery',
    'time': '2023-07',
    'content': 'Health home professor trial around.',
  },
  {
    'projectId': 'project_3',
    'name': 'Dustin Lane',
    'time': '2023-01',
    'content': 'Dinner down possible read prove scene.',
  },
  {
    'projectId': 'project_3',
    'name': 'Crystal Jackson',
    'time': '2024-08',
    'content': 'Seem material smile against.',
  },
  {
    'projectId': 'project_1',
    'name': 'Mr. Nicholas Yoder',
    'time': '2023-10',
    'content': 'Mission must their north family.',
  },
  {
    'projectId': 'project_3',
    'name': 'Matthew Ford',
    'time': '2023-03',
    'content': 'Soon return growth section build.',
  },
  {
    'projectId': 'project_1',
    'name': 'Melissa Hamilton',
    'time': '2024-02',
    'content': 'Test speak happen no the.',
  },
  {
    'projectId': 'project_1',
    'name': 'Vicki Cummings',
    'time': '2023-03',
    'content': 'Yeah thank stand card institution big stand trouble.',
  },
  {
    'projectId': 'project_1',
    'name': 'Emily Dennis',
    'time': '2023-04',
    'content': 'Resource travel behavior receive will glass tell.',
  },
  {
    'projectId': 'project_2',
    'name': 'Randy Ballard',
    'time': '2024-04',
    'content': 'Until common down ahead.',
  },
  {
    'projectId': 'project_4',
    'name': 'Patrick Burton',
    'time': '2023-01',
    'content': 'Gun blue task suddenly defense thus.',
  },
  {
    'projectId': 'project_2',
    'name': 'James Mejia',
    'time': '2023-07',
    'content': 'Under fast service opportunity management.',
  },
  {
    'projectId': 'project_2',
    'name': 'Megan Hayden',
    'time': '2023-02',
    'content': 'Carry prevent program prevent science right buy.',
  },
  {
    'projectId': 'project_1',
    'name': 'Ann Harding',
    'time': '2023-01',
    'content': 'Read pick compare visit arm member.',
  },
  {
    'projectId': 'project_1',
    'name': 'Todd Welch',
    'time': '2023-11',
    'content': 'Computer office single also contain per can.',
  },
  {
    'projectId': 'project_4',
    'name': 'Anthony Price',
    'time': '2022-12',
    'content': 'Its spend few world short pass.',
  },
  {
    'projectId': 'project_3',
    'name': 'Mary Small',
    'time': '2023-09',
    'content': 'Letter maybe fly meet Democrat west relationship case.',
  },
  {
    'projectId': 'project_2',
    'name': 'Joanna Herrera',
    'time': '2024-10',
    'content': 'Forget thus exist strong ten.',
  },
  {
    'projectId': 'project_1',
    'name': 'Jessica Boyle',
    'time': '2024-04',
    'content': 'Ball successful well idea top.',
  },
  {
    'projectId': 'project_2',
    'name': 'Joel Vasquez',
    'time': '2024-10',
    'content': 'Course memory site today between development environment.',
  },
  {
    'projectId': 'project_2',
    'name': 'Ruth Orr',
    'time': '2023-08',
    'content': 'Start manager current note news cold thus.',
  },
  {
    'projectId': 'project_1',
    'name': 'Sonya Herring',
    'time': '2024-05',
    'content': 'Part audience sell family begin citizen.',
  },
  {
    'projectId': 'project_1',
    'name': 'Sarah White',
    'time': '2023-02',
    'content': 'Help bad itself return.',
  },
  {
    'projectId': 'project_3',
    'name': 'Jeffery Esparza',
    'time': '2023-05',
    'content': 'Feeling night media newspaper act national learn entire.',
  },
  {
    'projectId': 'project_1',
    'name': 'Katherine Williams',
    'time': '2023-06',
    'content': 'Ground behavior century food five color himself.',
  },
  {
    'projectId': 'project_1',
    'name': 'Michael Bond',
    'time': '2024-08',
    'content': 'Example father nature outside model hold.',
  },
  {
    'projectId': 'project_1',
    'name': 'Tommy Bryant',
    'time': '2023-07',
    'content': 'Already news interview decide than call series class.',
  },
  {
    'projectId': 'project_1',
    'name': 'Megan Peterson DVM',
    'time': '2024-11',
    'content': 'Although protect debate quality.',
  },
  {
    'projectId': 'project_3',
    'name': 'Matthew Tucker',
    'time': '2023-09',
    'content': 'Half white stay old law pay training international.',
  },
  {
    'projectId': 'project_10',
    'name': 'Scott Wong',
    'time': '2024-07',
    'content': 'Production left outside themselves one and college.',
  },
  {
    'projectId': 'project_8',
    'name': 'Wayne Jones',
    'time': '2024-01',
    'content': 'Walk bar attorney fund pressure send.',
  },
  {
    'projectId': 'project_9',
    'name': 'Matthew Montgomery',
    'time': '2023-07',
    'content': 'Health home professor trial around.',
  },
  {
    'projectId': 'project_8',
    'name': 'Dustin Lane',
    'time': '2023-01',
    'content': 'Dinner down possible read prove scene.',
  },
  {
    'projectId': 'project_3',
    'name': 'Crystal Jackson',
    'time': '2024-08',
    'content': 'Seem material smile against.',
  },
];

function loadComments(projectId, commentsList) {
  // 筛选出当前项目的评论数据
  const projectComments = commentsData.filter((comment) => comment.projectId === projectId);

  // 清空现有评论（如果需要重新加载）
  commentsList.innerHTML = '';

  // 遍历并动态生成评论列表项
  for (const comment of projectComments) {
    const commentItem = document.createElement('li');
    commentItem.className = 'comment-item';
    commentItem.innerHTML = `
      <div class="line-one">
        <span class="comment-name">${comment.name}</span>
        <span class="comment-time">${comment.time}</span>
      </div>
      <div class="line-two">
        <span class="comment-content">${comment.content}</span>
      </div>
    `;
    commentsList.appendChild(commentItem);
  }
}

export { loadComments };
