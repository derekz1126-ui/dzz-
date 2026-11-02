(() => {
  'use strict';

  // English is the default. Only the language preference is stored locally.
  const storageKey = 'dzz-language';
  let currentLanguage = 'en';
  try { if (localStorage.getItem(storageKey) === 'zh') currentLanguage = 'zh'; } catch {}
  const messages = {
    en: {
      'motion.on': 'MOTION ON', 'motion.off': 'MOTION OFF',
      'motion.enable': 'Enable motion', 'motion.pause': 'Pause motion',
      'power.learn.word': 'LEARN FAST!',
      'power.learn.description': 'I ask precise questions, test my understanding, and use new knowledge while it is still fresh.',
      'power.frame.word': 'FIND THE WHY!',
      'power.frame.description': 'I look beyond the immediate request to understand the people, workflow, and problem underneath it.',
      'power.prototype.word': 'MAKE IT REAL!',
      'power.prototype.description': 'I turn an idea into a small working version so assumptions can meet reality.',
      'power.systems.word': 'CONNECT IT!',
      'power.systems.description': 'I connect tools, information, and decisions into a workflow that makes sense as a whole.',
      'power.iterate.word': 'ONE MORE TRY!',
      'power.iterate.description': 'I use feedback to change what is not working, and keep the useful parts.',
      'power.communicate.word': 'MAKE IT CLEAR!',
      'power.communicate.description': 'I make technical decisions understandable: what matters, what changes, and what happens next.',
      'power.research.word': 'DIG DEEPER!',
      'power.research.description': 'I look for primary sources, compare the evidence, and separate a useful fact from an attractive assumption.',
      'power.ai.word': 'THINK + BUILD!',
      'power.ai.description': 'I explore where AI can help a workflow, then check the result against the real task.',
      'power.debug.word': 'TRACE IT!',
      'power.debug.description': 'I reproduce the problem, narrow the cause, and verify the fix against the original failure.',
      'power.connect.word': 'LINK IT UP!',
      'power.connect.description': 'I trace inputs, outputs, and handoffs so separate tools can work together.',
      'power.feedback.word': 'LISTEN FIRST!',
      'power.feedback.description': 'I watch how people use a solution and let that evidence guide the next iteration.',
      'power.delivery.word': 'INTO THE FIELD!',
      'power.delivery.description': 'I think beyond the demo: clear setup, practical constraints, and a result that is useful in its actual setting.',
      'mission.open': 'EXPLORE THE APPROACH', 'mission.close': 'CLOSE FIELD NOTE',
      'mission.0.word': 'LEARN!', 'mission.1.word': 'WHY?', 'mission.2.word': 'BUILD!',
      'mission.3.word': 'CONNECT!', 'mission.4.word': 'TEST!', 'mission.5.word': 'CLARITY!',
      'quote.initial': '“The best way to understand something is to try making it work.”',
      'quote.0': 'Curiosity doesn’t clock out.',
      'quote.1': 'The fastest way to understand is to build something.',
      'quote.2': 'Ask a better question. Find a better next step.',
      'quote.3': 'A working prototype starts a better conversation.',
      'note.new': 'NEW IDEA!', 'theme.switch': 'SWITCH!', 'web.word': 'THWIP!',
      'portal.found': 'FOUND YOU!',
      'portal.decoy.0': 'NOT HERE!', 'portal.decoy.1': 'KEEP LOOKING!', 'portal.decoy.2': 'ALMOST!',
      'portal.hint': 'Follow the yellow signal. That’s where you’ll find DZZ.'
    },
    zh: {
      'motion.on': '动态已开启', 'motion.off': '动态已关闭',
      'motion.enable': '开启动效', 'motion.pause': '暂停动效',
      'power.learn.word': '快速上手！',
      'power.learn.description': '问准问题，验证自己的理解，再把新知识用起来。',
      'power.frame.word': '找到根因！',
      'power.frame.description': '不只看表面需求，也理解背后的人、流程和真正的问题。',
      'power.prototype.word': '动手实现！',
      'power.prototype.description': '先把想法做成一个能运行的小版本，让假设接受现实检验。',
      'power.systems.word': '连成整体！',
      'power.systems.description': '把工具、信息和决策串成完整流程，让各个环节协同工作。',
      'power.iterate.word': '再进一步！',
      'power.iterate.description': '根据反馈调整无效的部分，保留真正有用的东西。',
      'power.communicate.word': '说清楚！',
      'power.communicate.description': '把技术决策讲明白：什么重要、改变什么、下一步做什么。',
      'power.research.word': '深入求证！',
      'power.research.description': '查找一手资料，对照证据，分清事实与看似合理的假设。',
      'power.ai.word': '思考＋动手！',
      'power.ai.description': '探索 AI 能帮助流程的哪个环节，再对照真实任务检验结果。',
      'power.debug.word': '追到根源！',
      'power.debug.description': '复现问题，缩小原因范围，再用原来的失败场景验证修复。',
      'power.connect.word': '打通环节！',
      'power.connect.description': '理清输入、输出和交接方式，让不同工具配合起来。',
      'power.feedback.word': '先听再改！',
      'power.feedback.description': '观察人们如何使用方案，用实际反馈决定下一步改进。',
      'power.delivery.word': '走进现场！',
      'power.delivery.description': '不止于演示：考虑清晰的使用方法、现实限制，以及方案在实际场景中的价值。',
      'mission.open': '查看工作方法', 'mission.close': '收起这条笔记',
      'mission.0.word': '学起来！', 'mission.1.word': '为什么？', 'mission.2.word': '动手做！',
      'mission.3.word': '连起来！', 'mission.4.word': '试一试！', 'mission.5.word': '讲明白！',
      'quote.initial': '“想真正理解一件事，就试着让它运转起来。”',
      'quote.0': '好奇心不下班。',
      'quote.1': '理解一件事最快的方法，是动手做点什么。',
      'quote.2': '问得更准，下一步就更清楚。',
      'quote.3': '一个能运行的原型，能让讨论更有着落。',
      'note.new': '新想法！', 'theme.switch': '切换宇宙！', 'web.word': '咻！',
      'portal.found': '找到你了！',
      'portal.decoy.0': '不在这里！', 'portal.decoy.1': '继续找找！', 'portal.decoy.2': '快找到了！',
      'portal.hint': '跟着黄色信号走，就能找到 DZZ。'
    }
  };

  const bindings = [];
  const boundToggles = new WeakSet();
  let initialized = false;
  function t(key, fallback) {
    if (Object.prototype.hasOwnProperty.call(messages[currentLanguage], key)) return messages[currentLanguage][key];
    if (Object.prototype.hasOwnProperty.call(messages.en, key)) return messages.en[key];
    return fallback === undefined ? key : fallback;
  }
  function bindText(selector, chinese) {
    document.querySelectorAll(selector).forEach(element => {
      bindings.push({ element, mode: 'text', en: element.textContent, zh: chinese });
    });
  }
  // Capture the English text once. Keep existing icon spans, <br>s and listeners.
  function directTextNodes(element) {
    return [...element.childNodes].filter(node => node.nodeType === 3 && node.textContent.trim());
  }
  function bindDirect(selector, chinese) {
    document.querySelectorAll(selector).forEach(element => {
      const original = directTextNodes(element).map(node => node.textContent);
      bindings.push({ element, mode: 'direct', en: original, zh: Array.isArray(chinese) ? chinese : [chinese] });
    });
  }
  function bindAttribute(selector, attribute, chinese) {
    document.querySelectorAll(selector).forEach(element => {
      bindings.push({ element, mode: 'attribute', attribute, en: element.getAttribute(attribute), zh: chinese });
    });
  }
  function writeDirect(element, values) {
    const nodes = directTextNodes(element);
    values.forEach((value, index) => {
      if (nodes[index]) nodes[index].textContent = value;
      else element.appendChild(document.createTextNode(value));
    });
    nodes.slice(values.length).forEach(node => { node.textContent = ''; });
  }
  function captureStaticText() {
    bindText('.skip-link', '跳到正文');
    bindText('.main-nav a[href="#origin"]', '起点');
    bindText('.main-nav a[href="#powers"]', '能力');
    bindText('.main-nav a[href="#missions"]', '行动笔记');
    bindText('.main-nav a[href="#field"]', '工作方法');
    bindText('.main-nav a[href="#comms"]', '发出信号');
    bindText('.panel-corner', '01 / 故事起点');
    bindDirect('.portrait-burst', ['始终', '好奇！']);
    bindText('.portrait-frame figcaption', '一直在学习，一直在进步。');
    bindText('.portrait-scribble', '思考不停步 ↗');
    bindText('.role-line', '快速学习，带着 FDE 思维做事。');
    bindText('.speech-bubble > p', '“快速学习，做真正有价值的事。”');
    bindText('.origin-description', '我喜欢走近真实问题，学会需要的知识，把想法做成能运行的软件。带着 FDE 的一线思维，连接人、工具与系统，从第一个问题推进到实用的方案。好奇是本能，动手是选择，学习贯穿始终。');
    bindDirect('.origin-link', '了解我的做事方式 ');
    ['学习', '构建', '落地'].forEach((word, index) => bindText(`.principle:nth-child(${index + 1}) > p`, word));
    bindDirect('.principle:nth-child(1) > span', ['保持好奇。', '快速上手。']);
    bindDirect('.principle:nth-child(2) > span', ['做出东西。', '创造价值。']);
    bindDirect('.principle:nth-child(3) > span', ['走进现场。', '完成闭环。']);
    bindText('#powersTitle', '我的能力');
    const powerLabels = {
      learn: '快速学习', frame: '问题拆解', prototype: '原型构建', systems: '系统思考',
      iterate: '持续迭代', communicate: '清晰沟通', research: '资料研究', ai: 'AI 工作流',
      debug: '问题排查', connect: '系统集成', feedback: '用户反馈', delivery: '现场交付'
    };
    Object.entries(powerLabels).forEach(([key, label]) => bindDirect(`.power-chip[data-power="${key}"]`, ` ${label}`));
    bindText('#powerDetail', '问准问题，验证假设，再把新知识用起来。');
    bindText('#missionsTitle', '行动笔记');
    bindText('.mission-heading > p', '我的工作方法，一份现场指南。');
    bindText('.mission-intro', '六个做事原则，点击卡片了解具体方法。');
    const missions = [
      ['学会陌生的事', '走进不熟悉的领域，找到基础知识，问出更好的问题，再把所学用起来。', ['好奇心', '研究', '实践'], '从一个具体问题开始。查阅一手资料，尝试一个小例子，再用简单的话讲清楚所学。'],
      ['找到真正的问题', '走近使用者和工作流程，分清表面的需求与它真正要解决的问题。', ['场景', '提问', '理解'], '梳理当前的做法，找到阻碍出现的位置。先明确什么结果有用，再决定使用什么工具。'],
      ['做出第一个版本', '让想法有一个看得见的形态。先做出能运行的小版本，让假设接受现实检验。', ['原型', '聚焦', '反馈'], '选择足以回答关键问题的最小版本，让它容易尝试、容易检查，也容易修改。'],
      ['把系统连起来', '不只盯着单个功能，也理解输入、依赖关系与交接环节，让整体运转起来。', ['系统', '集成', '取舍'], '画清各个环节，检查边界，明确依赖关系。优先把连接讲清楚，而不是继续堆叠复杂度。'],
      ['放到现场检验', '让方案回到日常使用中，观察哪些有效、哪里让人犹豫、什么还需要调整。', ['观察', '验证', '迭代'], '测试真实流程，也测试那些不顺利的情况。根据证据决定保留什么、改进什么、删去什么。'],
      ['把事情讲明白', '让技术细节成为共同理解，说明决策、取舍，以及下一步值得做什么。', ['沟通', '写作', '共识'], '使用具体例子，讲清已知事实和待验证事项，给接手的人留下足够的背景。']
    ];
    missions.forEach(([title, summary, tags, extra], index) => {
      const card = `.mission-card[data-step="${index}"]`;
      bindText(`${card} .mission-title`, title);
      bindText(`${card} .mission-summary`, summary);
      tags.forEach((label, tagIndex) => bindText(`${card} .mission-tags > span:nth-child(${tagIndex + 1})`, label));
      bindText(`${card} .playbook-extra`, extra);
      bindText(`${card} .playbook-hint`, messages.zh['mission.open']);
    });
    bindText('#approachTitle', '现场工作法');
    bindText('#learningTitle', '学习循环');
    const dossiers = [
      ['贴近真实问题', '先理解场景，再动手写代码', '看清真实环境：谁在使用、有哪些限制、工作现在怎样进行。'],
      ['在实际使用中创造价值', '从一个想法，到日常可用', '始终关注结果，让方案更容易理解、更容易检验，也更容易使用。'],
      ['提问、尝试、复盘', '可以反复练习的方法', '从一个问题开始，做一个小尝试，再对照预期观察实际发生了什么。'],
      ['把经验留下来', '让每次理解成为下一次的起点', '记下发现，用简单的话说明白，再带着它走向下一个陌生问题。']
    ];
    document.querySelectorAll('.dossier-entry').forEach((entry, index) => {
      const translated = dossiers[index];
      if (!translated) return;
      [['h3', translated[0]], ['.dossier-caption', translated[1]], ['p:last-child', translated[2]]].forEach(([selector, value]) => {
        const element = entry.querySelector(selector);
        if (element) bindings.push({ element, mode: 'text', en: element.textContent, zh: value });
      });
    });
    bindDirect('.signal-kicker', ['DZZ UNIVERSE ', ' 聊聊你的想法']);
    bindText('#signalTitle', '发出信号');
    bindText('.signal-subtitle', '有想探索的点子、想解决的问题，或值得动手做的事，发封邮件聊聊。');
    bindText('.contact-card-caption', '从一封邮件开始。');
    bindText('.contact-card-title', '有个想法想推进？');
    bindText('.contact-card-copy', '告诉我你正在做什么、卡在哪里，以及你希望下一步做到什么。');
    bindDirect('.contact-mail-button', '发一封邮件 ');
    bindDirect('#replayUniverse', '重返宇宙 ');
    bindDirect('#noteShuffle', '再看一条笔记 ');
    bindText('.signal-note-label', '来自现场笔记');
    bindText('#fieldQuote', messages.zh['quote.initial']);
    bindText('.site-footer > p:nth-child(2)', '好奇心不下班。');
    bindDirect('#backTop', '回到起点 ');
    bindText('.portal-kicker', '进入');
    bindText('.portal-subtitle', '一颗好奇的心，无限的可能。');
    bindText('.portal-instruction', '找到黄色信号，发现 DZZ。');
    bindText('.decoy-one .node-label', '灵感');
    bindText('.decoy-two .node-label', '如果……');
    bindText('.decoy-three .node-label', '发现');
    bindText('#portalMessage', '每个好故事，都从一点好奇心开始。');
    bindDirect('#skipIntro', '跳过开场 ');
    bindText('.portal-issue', '第 001 期 / 保持开放');
    bindText('.warp-word', '出发！');

    bindAttribute('meta[name="description"]', 'content', 'DZZ UNIVERSE — 一个带着一线思维做事的好奇构建者。快速学习，清晰思考，做真正有价值的事。');
    bindAttribute('.wordmark', 'aria-label', 'DZZ UNIVERSE，回到起点');
    bindAttribute('.main-nav', 'aria-label', '主导航');
    bindAttribute('#themeToggle', 'aria-label', '切换配色宇宙');
    bindAttribute('.portrait-art', 'alt', '漫画人物俯瞰色彩鲜明的城市');
    bindAttribute('.principles-panel', 'aria-label', '三个做事原则');
    bindAttribute('.power-cloud', 'aria-label', '了解我的工作能力');
    bindAttribute('#universeIntro', 'aria-label', '进入 DZZ UNIVERSE');
    bindAttribute('#enterUniverse', 'aria-label', '进入 DZZ UNIVERSE');
    bindAttribute('.decoy-one', 'aria-label', '探索另一个信号');
    bindAttribute('.decoy-two', 'aria-label', '探索可能性的信号');
    bindAttribute('.decoy-three', 'aria-label', '探索发现的信号');
    bindAttribute('.decoy-one', 'data-label', '保持好奇！');
    bindAttribute('.decoy-two', 'data-label', '继续探索！');
    bindAttribute('.decoy-three', 'data-label', '跟着黄色信号！');
  }
  function bindLanguageButtons() {
    ['languageToggle', 'introLanguage'].forEach(id => {
      const button = document.getElementById(id);
      if (!button || boundToggles.has(button)) return;
      button.addEventListener('click', () => setLanguage(currentLanguage === 'en' ? 'zh' : 'en'));
      boundToggles.add(button);
    });
  }
  function syncButtons() {
    ['languageToggle', 'introLanguage'].forEach(id => {
      const button = document.getElementById(id);
      if (!button) return;
      button.textContent = currentLanguage === 'en' ? '中文' : 'EN';
      button.setAttribute('aria-label', currentLanguage === 'en' ? 'Switch to Chinese' : '切换为英文');
      button.setAttribute('lang', currentLanguage === 'en' ? 'zh-CN' : 'en');
    });
    ['motionToggle', 'introMotion'].forEach(id => {
      const button = document.getElementById(id);
      if (!button) return;
      const paused = button.getAttribute('aria-pressed') === 'true';
      writeDirect(button, [t(paused ? 'motion.off' : 'motion.on')]);
      button.setAttribute('aria-label', t(paused ? 'motion.enable' : 'motion.pause'));
    });
    // Preserve disclosure state even before the application receives the language event.
    document.querySelectorAll('.playbook-card').forEach(button => {
      const hint = button.querySelector('.playbook-hint');
      if (hint) hint.textContent = t(button.getAttribute('aria-expanded') === 'true' ? 'mission.close' : 'mission.open');
    });
  }
  function setLanguage(language) {
    const next = language === 'zh' ? 'zh' : 'en';
    document.dispatchEvent(new CustomEvent('dzz:before-language', { detail: { lang: next }, bubbles: true }));
    currentLanguage = next;
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    document.body.dataset.language = next;
    bindings.forEach(binding => {
      const value = binding[next];
      if (binding.mode === 'attribute') {
        if (value === null) binding.element.removeAttribute(binding.attribute);
        else binding.element.setAttribute(binding.attribute, value);
      } else if (binding.mode === 'direct') writeDirect(binding.element, value);
      else binding.element.textContent = value;
    });
    bindLanguageButtons();
    syncButtons();
    try { localStorage.setItem(storageKey, next); } catch {}
    document.dispatchEvent(new CustomEvent('dzz:language', { detail: { lang: next }, bubbles: true }));
    return next;
  }
  window.DZZI18n = { lang: () => currentLanguage, t, setLanguage };
  function initialize() {
    if (initialized) return;
    initialized = true;
    captureStaticText();
    setLanguage(currentLanguage);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
