(() => {
  const knowledge = Array.isArray(window.CLINIC_HELPER_KNOWLEDGE)
    ? window.CLINIC_HELPER_KNOWLEDGE
    : [];
  const keywordsByPage = {
    7: ['選址', '開業地點', '地點分析', '商圈', '地段', '人口資料'],
    12: ['開業檢查', '檢查準備', '檢查類別', '場所標示', '招牌', '消防', '逃生', '醫療廢棄物', '消毒設備', '管制藥品'],
    18: ['健保特約', '健保申請文件', '申請文件', '文件清單', '表單範例', '臺北格式'],
    93: ['裝潢', '空間規劃', '動線', '電源', '網路線路', '設備散熱', '工作站'],
    94: ['印表機', '電腦設備', '紙張動線', '線材', '插座'],
    97: ['開業物品', '開業用品', '開業前準備', '開業必備', '物品清單', '設備清單', '診療器材', '採購', '採買', '文具'],
    98: ['診所空間', '空間規劃', '病患隱私', '候診空間', '清潔消毒', '藥局規劃', '手部衛生'],
    99: ['急救', '急救設備', '急救用品', '急救箱', '有效期限'],
    137: ['系統導入', '導入流程', '教育訓練', '系統上線', '開業系統'],
    138: ['售後服務', '技術支援', '電話支援', '現場維修', '版本更新'],
    139: ['備份服務', '申報輔導', '系統更新', '遠端支援'],
    163: ['人員招募', '面試', '面談', '徵才', '員工遴選'],
  };

  const launcher = document.querySelector('.clinic-helper-launcher');
  const panel = document.querySelector('#clinic-helper-panel');
  const closeButton = document.querySelector('.clinic-helper-close');
  const form = document.querySelector('.clinic-helper-form');
  const input = document.querySelector('.clinic-helper-input');
  const sendButton = document.querySelector('.clinic-helper-send');
  const messages = document.querySelector('.clinic-helper-messages');
  const suggestions = document.querySelector('.clinic-helper-suggestions');
  const contactUrl = 'https://www.realsun.com.tw/form/contact_us';

  if (!launcher || !panel || !form || !input || !messages) return;

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  launcher.addEventListener('click', openPanel);
  closeButton.addEventListener('click', closePanel);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });

  input.addEventListener('input', () => {
    sendButton.disabled = input.value.trim().length === 0;
  });

  function addMessage(content, className = 'clinic-helper-message') {
    const message = document.createElement('div');
    message.className = className;
    message.textContent = content;
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }

  function normalize(value) {
    return value.toLocaleLowerCase('zh-TW').replace(/[\s\p{P}\p{S}]+/gu, '');
  }

  function detectIntent(question) {
    const query = normalize(question);
    if (/^(你好|您好|哈囉|哈啰|嗨|hi|hello|早安|午安)(啊|呀|喔|囉|嗎|嘛)?$/iu.test(query)) return 'greeting';
    if (/^(謝謝(你|您)?(幫忙|協助|解答)?|感謝(你|您)?(幫忙|協助|解答)?|多謝|謝啦|thanks|thankyou|太感謝(了|啦)?)(啊|呀|喔|啦)?$/iu.test(query)) return 'thanks';
    if (/^(再見|掰掰|拜拜|先這樣|先到這裡|下次見|晚安)(囉|啦|喔|了)?$/u.test(query)) return 'goodbye';
    if (/^(好的?|好喔|好啊|了解|明白了)$/u.test(query)) return 'acknowledgement';
    if (/(你可以做什麼|可以問你什麼|能問你什麼|你能幫我什麼|你可以幫什麼|怎麼使用|如何使用|你是誰)/u.test(query)) return 'capabilities';
    return null;
  }

  function addIntentReply(intent) {
    const replies = {
      greeting: '您好！我是診所開業小幫手，可以協助查詢開業地點分析、檢查準備、空間規劃、物品盤點及人員面談。您想先了解哪一項？',
      thanks: '不客氣！若還有診所開業準備相關問題，歡迎繼續問我。',
      goodbye: '謝謝使用，祝您籌備順利！如需進一步協助，歡迎到「聯絡我們」免費諮詢。',
      acknowledgement: '好的，您可以繼續詢問診所開業準備、空間規劃或設備盤點等問題。',
      capabilities: '我可以協助查詢手冊整理的開業地點分析、一般檢查類別、空間規劃、物品盤點、人員面談及部分服務類別。遇到手冊未涵蓋或需要確認最新規定的問題，我會引導您聯絡我們。',
    };
    addMessage(replies[intent] || replies.greeting);
  }

  function findAnswer(question) {
    const query = normalize(question);
    if (!query || knowledge.length === 0) return null;

    // Common natural-language variations for the reviewed opening-supplies section.
    if (/開業.{0,8}(準備|採購|採買|買|物品|用品|設備|清單)/u.test(query)) {
      return knowledge.find(item => item.page === 97) || null;
    }

    let best = null;
    let bestScore = 0;
    for (const item of knowledge) {
      const terms = keywordsByPage[item.page] || [];
      let score = 0;
      for (const term of terms) {
        const normalizedTerm = normalize(term);
        if (normalizedTerm.length < 2) continue;
        if (query.includes(normalizedTerm)) {
          score += normalizedTerm.length + 1;
        } else if (query.length >= 2 && normalizedTerm.includes(query)) {
          score += query.length;
        }
      }
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
    return bestScore >= 2 ? best : null;
  }

  function addAnswer(item) {
    const card = document.createElement('div');
    card.className = 'clinic-helper-message';
    const answer = document.createElement('p');
    answer.textContent = item.text;
    card.append(answer);

    const source = document.createElement('span');
    source.className = 'clinic-helper-source';
    source.textContent = `來源：診所開業手冊 PDF 第 ${item.page} 頁｜${item.topic}`;
    card.append(source);
    messages.append(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function addContactFallback() {
    const card = addMessage('我目前無法從已整理的手冊內容確認這個問題。歡迎免費諮詢，請至「聯絡我們」與我們聯繫。');
    const link = document.createElement('a');
    link.href = contactUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '前往聯絡我們';
    card.append(document.createElement('br'), link);
  }

  function answerQuestion(rawQuestion) {
    const question = rawQuestion.trim();
    if (!question) return;
    addMessage(question, 'clinic-helper-message clinic-helper-message-user');
    const intent = detectIntent(question);
    if (intent) {
      addIntentReply(intent);
      return;
    }
    const item = findAnswer(question);
    if (item) addAnswer(item);
    else addContactFallback();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.slice(0, 300);
    input.value = '';
    sendButton.disabled = true;
    answerQuestion(question);
    input.focus();
  });

  suggestions.addEventListener('click', event => {
    const button = event.target.closest('.clinic-helper-suggestion');
    if (!button) return;
    answerQuestion(button.textContent || '');
  });
})();
