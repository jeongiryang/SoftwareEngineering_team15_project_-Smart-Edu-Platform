export const DEFAULT_LANGUAGE = 'ko';

export const LANGUAGE_STORAGE_KEY = 'smartEduLanguage';

export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어', beta: false, htmlLang: 'ko' },
  { code: 'en', label: 'English', beta: true, htmlLang: 'en' },
  { code: 'ja', label: '日本語', beta: true, htmlLang: 'ja' },
  { code: 'zh', label: '中文', beta: true, htmlLang: 'zh-CN' }
];

const TRANSLATION_ENTRIES = [
  ['언어 선택', 'Language', '言語選択', '语言选择'],
  ['현재 언어', 'Current language', '現在の言語', '当前语言'],
  ['한국어', 'Korean', '韓国語', '韩语'],
  ['정식 검수 전 1차 지원 언어', 'First-pass language support before final review', '正式検収前の一次対応言語', '正式审校前的一次支持语言'],
  ['사각사각', 'Sagak Sagak', 'サガクサガク', '沙沙学习'],
  ['서비스 소개', 'Overview', 'サービス紹介', '服务介绍'],
  ['로그인', 'Log in', 'ログイン', '登录'],
  ['회원가입', 'Create account', '新規登録', '注册'],
  ['무료로 시작하기', 'Start for free', '無料で始める', '免费开始'],
  ['대시보드', 'Dashboard', 'ダッシュボード', '仪表板'],
  ['프로필', 'Profile', 'プロフィール', '个人主页'],
  ['통계', 'Statistics', '統計', '统计'],
  ['친구', 'Friends', '友だち', '好友'],
  ['AI 학습', 'AI Study', 'AI学習', 'AI 学习'],
  ['접근성', 'Accessibility', 'アクセシビリティ', '无障碍'],
  ['커뮤니티', 'Community', 'コミュニティ', '社区'],
  ['일정', 'Schedule', 'スケジュール', '日程'],
  ['칸반', 'Board', 'カンバン', '看板'],
  ['관리자', 'Admin', '管理者', '管理员'],
  ['마이페이지', 'My Page', 'マイページ', '我的页面'],
  ['로그아웃', 'Log out', 'ログアウト', '退出登录'],
  ['사용자', 'User', 'ユーザー', '用户'],
  ['라이트 모드', 'Light mode', 'ライトモード', '浅色模式'],
  ['다크 모드', 'Dark mode', 'ダークモード', '深色模式'],
  ['고대비', 'High contrast', '高コントラスト', '高对比度'],
  ['라이트', 'Light', 'ライト', '浅色'],
  ['다크', 'Dark', 'ダーク', '深色'],
  ['확인', 'Confirm', '確認', '确认'],
  ['취소', 'Cancel', 'キャンセル', '取消'],
  ['닫기', 'Close', '閉じる', '关闭'],
  ['저장', 'Save', '保存', '保存'],
  ['수정', 'Edit', '編集', '编辑'],
  ['삭제', 'Delete', '削除', '删除'],
  ['검색', 'Search', '検索', '搜索'],
  ['요청', 'Request', 'リクエスト', '请求'],
  ['수락', 'Accept', '承認', '接受'],
  ['거절', 'Decline', '拒否', '拒绝'],
  ['보내기', 'Send', '送信', '发送'],
  ['다시 시도', 'Try again', '再試行', '重试'],
  ['이전', 'Previous', '前へ', '上一步'],
  ['다음', 'Next', '次へ', '下一步'],
  ['오늘', 'Today', '今日', '今天'],
  ['이번 주', 'This week', '今週', '本周'],
  ['최근 7일', 'Last 7 days', '直近7日', '最近 7 天'],
  ['최근 4주', 'Last 4 weeks', '直近4週間', '最近 4 周'],
  ['전체', 'All', 'すべて', '全部'],
  ['완료', 'Done', '完了', '完成'],
  ['진행 중', 'In progress', '進行中', '进行中'],
  ['대기', 'Pending', '保留中', '待处理'],
  ['보류', 'On hold', '保留', '搁置'],
  ['실패', 'Failed', '失敗', '失败'],
  ['성공', 'Success', '成功', '成功'],
  ['로딩 중', 'Loading', '読み込み中', '加载中'],
  ['비어 있음', 'Empty', '空です', '暂无内容'],
  ['공부의 흔적을', 'Build your learning traces', '学びの足跡を', '把学习的痕迹'],
  ['쌓아가세요', 'one note at a time', '少しずつ積み上げよう', '一点点积累起来'],
  ['개인화 학습 관리 플랫폼', 'Personalized learning management platform', 'パーソナライズ学習管理プラットフォーム', '个性化学习管理平台'],
  ['Personalized Smart Edu Platform', 'Personalized Smart Edu Platform', 'Personalized Smart Edu Platform', 'Personalized Smart Edu Platform'],
  ['학습 목표, 일정, 보상, 접근성 설정을 한 화면 흐름으로 연결합니다.', 'Connect goals, schedules, rewards, and accessibility settings in one flow.', '学習目標、予定、報酬、アクセシビリティ設定を一つの流れでつなぎます。', '将学习目标、日程、奖励和无障碍设置串联成一个流程。'],
  ['작은 기록이 쌓여 나만의 학습 루틴이 됩니다.', 'Small records grow into your own study routine.', '小さな記録が自分だけの学習ルーティンになります。', '小小记录会积累成属于你的学习节奏。'],
  ['이메일', 'Email', 'メール', '邮箱'],
  ['비밀번호', 'Password', 'パスワード', '密码'],
  ['새 비밀번호', 'New password', '新しいパスワード', '新密码'],
  ['비밀번호 확인', 'Confirm password', 'パスワード確認', '确认密码'],
  ['닉네임', 'Nickname', 'ニックネーム', '昵称'],
  ['이름', 'Name', '名前', '姓名'],
  ['8자 이상으로 입력해 주세요.', 'Use at least 8 characters.', '8文字以上で入力してください。', '请输入至少 8 个字符。'],
  ['두 비밀번호가 일치해요.', 'The two passwords match.', '2つのパスワードが一致しています。', '两次密码一致。'],
  ['두 비밀번호가 달라요.', 'The passwords do not match.', '2つのパスワードが一致しません。', '两次密码不一致。'],
  ['조금 더 입력해 주세요.', 'Please enter a little more.', 'もう少し入力してください。', '请再输入一些内容。'],
  ['사용할 수 있는 닉네임이에요. 멋지네요!', 'This nickname format works. Looks good!', '使えるニックネーム形式です。いいですね！', '这个昵称格式可用，很不错！'],
  ['형식상 사용 가능한 닉네임이에요.', 'This nickname format looks valid.', '形式上は使えるニックネームです。', '这个昵称格式看起来可用。'],
  ['오늘의 학습 자극', 'Study nudge for today', '今日の学習きっかけ', '今日学习激励'],
  ['학습 자극', 'Study nudge', '学習きっかけ', '学习激励'],
  ['1초 복습 퀴즈', 'One-second review quiz', '1秒復習クイズ', '1 秒复习题'],
  ['오늘 숨김', 'Hide for today', '今日は非表示', '今天不再显示'],
  ['웹 1차 구현이며 OS 잠금화면 개입은 하지 않습니다.', 'This is a first web implementation and does not affect the OS lock screen.', 'Web一次実装であり、OSのロック画面には介入しません。', '这是 Web 端的一次实现，不会干预系统锁屏。'],
  ['데모형 빠른 복습 카드입니다.', 'This is a demo-style quick review card.', 'デモ用のクイック復習カードです。', '这是演示用的快速复习卡片。'],
  ['오늘 집중 기록이 아직 없어요. 25분부터 시작해 볼까요?', 'No focus record yet today. Start with 25 minutes?', '今日はまだ集中記録がありません。25分から始めますか？', '今天还没有专注记录。要从 25 分钟开始吗？'],
  ['보상 현황', 'Reward status', '報酬状況', '奖励状态'],
  ['보유 포인트', 'Available points', '保有ポイント', '当前积分'],
  ['획득 배지', 'Earned badges', '獲得バッジ', '已获徽章'],
  ['퀘스트', 'Quests', 'クエスト', '任务'],
  ['보상 확인하기', 'View rewards', '報酬を見る', '查看奖励'],
  ['학습 통계 그래프', 'Study statistics graphs', '学習統計グラフ', '学习统计图表'],
  ['집중력 유형', 'Focus type', '集中タイプ', '专注类型'],
  ['주간 처방전', 'Weekly study prescription', '週間学習提案', '每周学习建议'],
  ['AI 스타일 분석', 'AI-style analysis', 'AI風分析', 'AI 风格分析'],
  ['실제 외부 AI 호출 없이 최근 학습 기록을 규칙 기반으로 해석합니다.', 'Interprets recent study records with rules, without external AI calls.', '外部AIを呼び出さず、最近の学習記録をルールベースで解釈します。', '不调用外部 AI，仅基于规则解读最近的学习记录。'],
  ['실제 외부 AI 호출 없이', 'Without external AI calls', '外部AI呼び出しなしで', '不调用外部 AI'],
  ['룰 기반', 'Rule-based', 'ルールベース', '规则驱动'],
  ['연속 학습', 'Study streak', '連続学習', '连续学习'],
  ['망각곡선 복습 예정', 'Spaced review plan', '忘却曲線の復習予定', '遗忘曲线复习计划'],
  ['주간 집중 막대', 'Weekly focus bars', '週間集中バー', '每周专注柱状图'],
  ['최근 4주 히트맵', 'Last 4 weeks heatmap', '直近4週間ヒートマップ', '最近 4 周热力图'],
  ['오늘 집중', 'Today focus', '今日の集中', '今日专注'],
  ['이번 주 집중', 'This week focus', '今週の集中', '本周专注'],
  ['전체 집중', 'Total focus', '総集中時間', '总专注'],
  ['평균 세션', 'Average session', '平均セッション', '平均单次时长'],
  ['저장 대기 중인 집중 기록', 'Queued focus records', '保存待ちの集中記録', '待同步专注记录'],
  ['다시 전송', 'Resend', '再送信', '重新发送'],
  ['친구와 함께 학습 흐름을 이어가기', 'Keep your learning flow with friends', '友だちと学習の流れを続ける', '和好友一起延续学习节奏'],
  ['친구 검색', 'Find friends', '友だち検索', '搜索好友'],
  ['받은 요청', 'Received requests', '受け取ったリクエスト', '收到的请求'],
  ['보낸 요청', 'Sent requests', '送信済みリクエスト', '已发送请求'],
  ['친구 목록', 'Friend list', '友だちリスト', '好友列表'],
  ['친구 요청', 'Friend request', '友だちリクエスト', '好友请求'],
  ['이미 친구입니다.', 'Already friends.', 'すでに友だちです。', '已经是好友。'],
  ['이미 친구 요청을 보냈습니다.', 'You already sent a friend request.', 'すでに友だちリクエストを送信しました。', '你已经发送过好友请求。'],
  ['자기 자신에게 친구 요청을 보낼 수 없습니다.', 'You cannot send a friend request to yourself.', '自分自身には友だちリクエストを送れません。', '不能向自己发送好友请求。'],
  ['일정 추가', 'Add schedule', '予定を追加', '添加日程'],
  ['오늘 일정', 'Today schedule', '今日の予定', '今日日程'],
  ['마감일', 'Due date', '締切日', '截止日期'],
  ['시작일', 'Start date', '開始日', '开始日期'],
  ['종료일', 'End date', '終了日', '结束日期'],
  ['제목', 'Title', 'タイトル', '标题'],
  ['설명', 'Description', '説明', '说明'],
  ['카테고리', 'Category', 'カテゴリ', '分类'],
  ['우선순위', 'Priority', '優先度', '优先级'],
  ['D-Day 계획 생성', 'Generate D-Day plan', 'D-Day計画を作成', '生成 D-Day 计划'],
  ['학습 범위', 'Study scope', '学習範囲', '学习范围'],
  ['총 분량', 'Total amount', '総分量', '总量'],
  ['미리보기', 'Preview', 'プレビュー', '预览'],
  ['태스크', 'Task', 'タスク', '任务'],
  ['태스크 만들기', 'Create task', 'タスクを作成', '创建任务'],
  ['TODO', 'TODO', 'TODO', '待办'],
  ['IN_PROGRESS', 'IN_PROGRESS', '進行中', '进行中'],
  ['DONE', 'DONE', '完了', '已完成'],
  ['AI 학습 지원 센터', 'AI study support center', 'AI学習サポートセンター', 'AI 学习支持中心'],
  ['AI Mock 모드', 'AI Mock mode', 'AI Mockモード', 'AI 模拟模式'],
  ['Mock 사용 중', 'Mock enabled', 'Mock使用中', '正在使用模拟'],
  ['Mock 켜기', 'Enable mock', 'Mockをオン', '开启模拟'],
  ['Mock 끄기', 'Disable mock', 'Mockをオフ', '关闭模拟'],
  ['AI 사용 안내', 'AI usage guide', 'AI利用ガイド', 'AI 使用说明'],
  ['AI 대화방', 'AI chat room', 'AIチャットルーム', 'AI 聊天室'],
  ['새 대화', 'New chat', '新しい会話', '新对话'],
  ['AI에게 질문하기', 'Ask AI', 'AIに質問する', '向 AI 提问'],
  ['질문 입력', 'Enter a question', '質問を入力', '输入问题'],
  ['질문 제출하기', 'Submit question', '質問を送信', '提交问题'],
  ['Mock 응답', 'Mock response', 'Mock応答', '模拟回复'],
  ['데모 응답', 'Demo response', 'デモ応答', '演示回复'],
  ['이미지 첨부', 'Attach image', '画像を添付', '附加图片'],
  ['이미지 파일을 첨부했어요.', 'Image file attached.', '画像ファイルを添付しました。', '已附加图片文件。'],
  ['이미지 첨부 1차 검토', 'Image attachment first-pass review', '画像添付の一次検討', '图片附加一次评估'],
  ['이미지 선택', 'Choose image', '画像を選択', '选择图片'],
  ['첨부 제거', 'Remove attachment', '添付を削除', '移除附件'],
  ['지원 확장자', 'Supported formats', '対応形式', '支持格式'],
  ['파일 크기', 'File size', 'ファイルサイズ', '文件大小'],
  ['개인정보가 포함된 이미지는 첨부하지 마세요.', 'Do not attach images containing personal information.', '個人情報を含む画像は添付しないでください。', '请勿附加包含个人信息的图片。'],
  ['현재 1차 구현은 데모/검토용 이미지 첨부 흐름입니다.', 'This first implementation is a demo/review image attachment flow.', '現在の一次実装はデモ・検討用の画像添付フローです。', '当前一次实现是用于演示/评估的图片附加流程。'],
  ['실제 외부 AI Vision 분석은 아직 연결되지 않았습니다.', 'External AI Vision analysis is not connected yet.', '外部AI Vision分析はまだ接続されていません。', '尚未接入外部 AI Vision 分析。'],
  ['OCR/PDF 노트·퀴즈 생성 검토', 'OCR/PDF note and quiz review', 'OCR/PDFノート・クイズ生成検討', 'OCR/PDF 笔记与测验生成评估'],
  ['이미지/PDF로 노트·퀴즈 만들기', 'Create notes and quizzes from images/PDFs', '画像/PDFからノート・クイズを作成', '用图片/PDF 生成笔记和测验'],
  ['파일 선택', 'Choose file', 'ファイルを選択', '选择文件'],
  ['PDF는 현재 검토용으로만 미리보기돼요.', 'PDFs are previewed only for review in this version.', 'PDFは現在、検討用としてのみプレビューされます。', '当前 PDF 仅用于评估预览。'],
  ['데모 예시', 'Demo example', 'デモ例', '演示示例'],
  ['예시 노트 요약', 'Sample note summary', 'ノート要約例', '示例笔记摘要'],
  ['예시 퀴즈', 'Sample quiz', 'クイズ例', '示例测验'],
  ['토큰이 만료되었습니다.', 'The token has expired.', 'トークンの有効期限が切れました。', '令牌已过期。'],
  ['사용량 한도를 초과했습니다.', 'The usage quota has been exceeded.', '使用量の上限を超えました。', '已超出使用额度。'],
  ['API key가 설정되지 않았습니다.', 'API key is not configured.', 'API keyが設定されていません。', '尚未配置 API key。'],
  ['네트워크 오류가 발생했습니다.', 'A network error occurred.', 'ネットワークエラーが発生しました。', '发生网络错误。'],
  ['실제 AI 호출', 'Real AI call', '実際のAI呼び出し', '真实 AI 调用'],
  ['실제 외부 AI 호출 없음', 'No external AI calls', '外部AI呼び出しなし', '无外部 AI 调用'],
  ['접근성 설정', 'Accessibility settings', 'アクセシビリティ設定', '无障碍设置'],
  ['음성 설정', 'Voice settings', '音声設定', '语音设置'],
  ['전체 읽기', 'Read all', 'すべて読み上げ', '朗读全部'],
  ['읽어주기 안내', 'Read-aloud guide', '読み上げ案内', '朗读说明'],
  ['큰 글씨', 'Large text', '大きな文字', '大字体'],
  ['쉬운 용어', 'Easy wording', 'やさしい表現', '简明用语'],
  ['음성 출력', 'Voice output', '音声出力', '语音输出'],
  ['복습 알림', 'Review reminder', '復習通知', '复习提醒'],
  ['관리자 화면', 'Admin screen', '管理画面', '管理员页面'],
  ['신고 관리', 'Report management', '通報管理', '举报管理'],
  ['보상 관리', 'Reward management', '報酬管理', '奖励管理'],
  ['사용자 관리', 'User management', 'ユーザー管理', '用户管理'],
  ['처리 완료', 'Resolved', '対応済み', '已处理'],
  ['기각', 'Dismissed', '却下', '已驳回'],
  ['게시글', 'Post', '投稿', '帖子'],
  ['댓글', 'Comment', 'コメント', '评论'],
  ['좋아요', 'Like', 'いいね', '点赞'],
  ['싫어요', 'Dislike', 'よくない', '点踩'],
  ['북마크', 'Bookmark', 'ブックマーク', '收藏'],
  ['신고', 'Report', '通報', '举报'],
  ['글쓰기', 'Write post', '投稿する', '写帖子'],
  ['자료 공유', 'Resource sharing', '資料共有', '资料分享'],
  ['공부 인증', 'Study proof', '学習記録', '学习打卡'],
  ['학습 질문', 'Study question', '学習質問', '学习提问'],
  ['잡담/응원', 'Chat/cheer', '雑談・応援', '闲聊/鼓励'],
  ['시험 대비', 'Exam prep', '試験対策', '备考'],
  ['빈 상태', 'Empty state', '空の状態', '空状态'],
  ['아직 데이터가 없습니다.', 'No data yet.', 'まだデータがありません。', '暂无数据。'],
  ['오늘 목표를 입력하면 바로 일정으로 이어갈 수 있어요.', 'Enter today’s goal to turn it into a schedule.', '今日の目標を入力すると、すぐ予定につなげられます。', '输入今天的目标后可以直接连接到日程。'],
  ['이번 주는 집중 시간이 꾸준히 쌓이고 있어요.', 'Your focus time is building steadily this week.', '今週は集中時間が着実に積み上がっています。', '本周专注时间正在稳定累积。'],
  ['아직 일정이 없다면 오늘의 목표를 하나 추가해 보세요.', 'If there is no schedule yet, add one goal for today.', '予定がまだなければ、今日の目標を1つ追加してみましょう。', '如果还没有日程，可以先添加一个今日目标。'],
  ['개발/데모 확인용', 'For development/demo review', '開発・デモ確認用', '用于开发/演示检查'],
  ['로컬/개발 DB', 'local/development DB', 'ローカル・開発DB', '本地/开发数据库'],
  ['날짜를 선택하세요', 'Select a date', '日付を選択してください', '请选择日期'],
  ['월', 'Mon', '月', '周一'],
  ['화', 'Tue', '火', '周二'],
  ['수', 'Wed', '水', '周三'],
  ['목', 'Thu', '木', '周四'],
  ['금', 'Fri', '金', '周五'],
  ['토', 'Sat', '土', '周六'],
  ['일', 'Sun', '日', '周日'],
  ['눌러서 직접 입력 열기', 'Press to open manual input', '押して直接入力を開く', '点击打开手动输入'],
  ['직접 입력 열림', 'Manual input opened', '直接入力が開きました', '已打开手动输入'],
  ['말하기로 글쓰기', 'Write by speaking', '話して入力', '语音输入文字'],
  ['음성입력', 'Voice input', '音声入力', '语音输入'],
  ['멈추기', 'Stop', '停止', '停止'],
  ['입력 중지', 'Stop input', '入力を停止', '停止输入'],
  ['마이크 권한이 필요합니다. 브라우저 사이트 설정에서 마이크를 허용해 주세요.', 'Microphone permission is required. Allow the microphone in browser site settings.', 'マイク権限が必要です。ブラウザのサイト設定でマイクを許可してください。', '需要麦克风权限。请在浏览器站点设置中允许麦克风。'],
  ['마이크를 찾지 못했습니다. 기기 마이크 연결을 확인해 주세요.', 'No microphone was found. Check your device microphone.', 'マイクが見つかりません。端末のマイク接続を確認してください。', '未找到麦克风。请检查设备麦克风连接。'],
  ['음성 입력 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.', 'Voice input is unstable. Please try again shortly.', '音声入力の接続が不安定です。少し後でもう一度お試しください。', '语音输入连接不稳定。请稍后重试。'],
  ['현재 브라우저는 음성 입력을 지원하지 않습니다. Chrome 또는 Edge에서 다시 시도해 주세요.', 'This browser does not support voice input. Try again in Chrome or Edge.', 'このブラウザは音声入力に対応していません。ChromeまたはEdgeでお試しください。', '当前浏览器不支持语音输入。请使用 Chrome 或 Edge 重试。'],
  ['읽어주기를 시작하지 못했습니다. Chrome 사이트 소리 권한과 기기 볼륨을 확인해 주세요.', 'Could not start read-aloud. Check Chrome site sound permission and device volume.', '読み上げを開始できませんでした。Chromeのサイト音声権限と端末音量を確認してください。', '无法开始朗读。请检查 Chrome 站点声音权限和设备音量。'],
  ['현재 화면에서 읽을 내용을 찾지 못했습니다.', 'Could not find readable content on the current screen.', '現在の画面で読み上げる内容が見つかりませんでした。', '当前页面未找到可朗读内容。'],
  ['AI Mock 모드를 켰습니다. 실제 외부 AI 호출 없이 데모 응답을 표시합니다.', 'AI Mock mode is on. Demo responses are shown without external AI calls.', 'AI Mockモードをオンにしました。外部AIを呼び出さずデモ応答を表示します。', '已开启 AI 模拟模式。不调用外部 AI，仅显示演示回复。'],
  ['AI Mock 모드를 껐습니다. 기존 AI 학습 API 흐름을 사용합니다.', 'AI Mock mode is off. The existing AI study API flow will be used.', 'AI Mockモードをオフにしました。既存のAI学習APIフローを使用します。', '已关闭 AI 模拟模式。将使用现有 AI 学习 API 流程。'],
  ['AI 답변 생성이 성공적으로 완료되었습니다.', 'AI answer generation completed successfully.', 'AI回答の生成が完了しました。', 'AI 回复生成已完成。'],
  ['AI 요청 한도나 quota를 초과했을 수 있습니다. 잠시 후 다시 시도하거나 Mock 모드를 켜서 데모를 이어가세요.', 'The AI request limit or quota may have been exceeded. Try again later or continue the demo with Mock mode.', 'AIリクエスト上限またはquotaを超えた可能性があります。後で再試行するか、Mockモードでデモを続けてください。', 'AI 请求限制或配额可能已超出。请稍后重试，或开启模拟模式继续演示。'],
  ['AI 응답을 불러오지 못했습니다. 민감정보를 포함하지 않았는지 확인하고, 필요하면 Mock 모드로 데모 흐름을 확인해 주세요.', 'Could not load the AI response. Check that no sensitive information was included, or use Mock mode for the demo flow.', 'AI応答を読み込めませんでした。機密情報を含めていないか確認し、必要ならMockモードでデモフローを確認してください。', '无法加载 AI 回复。请确认未包含敏感信息，必要时使用模拟模式查看演示流程。'],
  ['AI 제공자 설정이나 API key 상태를 확인해야 합니다. 현재 화면에서는 Mock 모드로 안전하게 시연할 수 있습니다.', 'Check the AI provider settings or API key status. You can safely demo this screen with Mock mode.', 'AIプロバイダー設定またはAPI keyの状態を確認してください。この画面ではMockモードで安全にデモできます。', '请检查 AI 提供方设置或 API key 状态。当前页面可使用模拟模式安全演示。'],
  ['네트워크 연결이 불안정해 AI 응답을 가져오지 못했습니다. 연결을 확인하거나 Mock 모드로 전환해 주세요.', 'The network is unstable, so the AI response could not be retrieved. Check the connection or switch to Mock mode.', 'ネットワーク接続が不安定なためAI応答を取得できませんでした。接続を確認するかMockモードに切り替えてください。', '网络连接不稳定，无法获取 AI 回复。请检查连接或切换到模拟模式。'],
  ['로그인 정보가 만료되었을 수 있습니다. 다시 로그인하거나 Mock 모드로 데모 흐름을 확인해 주세요.', 'Your login session may have expired. Log in again or use Mock mode to view the demo flow.', 'ログイン情報の有効期限が切れた可能性があります。再ログインするかMockモードでデモフローを確認してください。', '登录信息可能已过期。请重新登录，或使用模拟模式查看演示流程。'],
  ['실제 외부 AI 호출이 아닌 발표/데모 안정성을 위한 Mock 응답입니다.', 'This is a Mock response for stable presentation/demo flow, not an external AI call.', 'これは発表・デモ安定性のためのMock応答であり、外部AI呼び出しではありません。', '这是用于稳定演示流程的模拟回复，并非外部 AI 调用。'],
  ['이미지 첨부 데모 응답을 추가했습니다. 실제 분석 결과가 아닌 안내용 mock 응답입니다.', 'Added an image attachment demo response. This is a guide-only mock response, not an actual analysis result.', '画像添付デモ応答を追加しました。実際の分析結果ではなく案内用Mock応答です。', '已添加图片附加演示回复。这是说明用模拟回复，不是真实分析结果。'],
  ['OCR/PDF 검토용 파일을 선택했습니다. 현재는 서버 업로드 없이 mock 결과만 확인합니다.', 'Selected a file for OCR/PDF review. For now, only mock results are shown without server upload.', 'OCR/PDF検討用ファイルを選択しました。現在はサーバーアップロードなしでMock結果のみ確認します。', '已选择 OCR/PDF 评估文件。当前不会上传服务器，仅查看模拟结果。'],
  ['OCR/PDF 데모 결과를 생성했습니다. 실제 분석이나 저장은 수행하지 않았습니다.', 'Generated OCR/PDF demo results. No actual analysis or saving was performed.', 'OCR/PDFデモ結果を生成しました。実際の分析や保存は行っていません。', '已生成 OCR/PDF 演示结果。未进行真实分析或保存。'],
  ['실제 노트/퀴즈 저장은 파일 처리 정책과 비용 검토 후 후속 범위에서 결정합니다.', 'Saving real notes/quizzes will be decided later after reviewing file handling and cost policies.', '実際のノート・クイズ保存は、ファイル処理方針と費用を確認した後の後続範囲で決定します。', '真实笔记/测验保存将在评估文件处理政策和成本后作为后续范围决定。'],
  ['공부 알람 약속을 잘 저장했어요!', 'Study reminder saved.', '学習リマインダーを保存しました。', '学习提醒已保存。'],
  ['설정을 저장하지 못했어요. 다시 해볼까요?', 'Could not save settings. Try again?', '設定を保存できませんでした。もう一度試しますか？', '未能保存设置。要重试吗？'],
  ['화면 설정이 잘 저장되었어요!', 'Display settings saved.', '画面設定を保存しました。', '显示设置已保存。'],
  ['복습 알림 등록에 실패했습니다.', 'Failed to create the review reminder.', '復習通知の登録に失敗しました。', '复习提醒创建失败。'],
  ['접근성 설정 저장에 실패했습니다.', 'Failed to save accessibility settings.', 'アクセシビリティ設定の保存に失敗しました。', '无障碍设置保存失败。'],
  ['데이터를 불러오는 데 실패했습니다.', 'Failed to load data.', 'データの読み込みに失敗しました。', '加载数据失败。'],
  ['게시글 목록을 불러오지 못했습니다.', 'Could not load the post list.', '投稿一覧を読み込めませんでした。', '无法加载帖子列表。'],
  ['게시글을 작성했습니다.', 'Post created.', '投稿を作成しました。', '帖子已发布。'],
  ['게시글을 수정했습니다.', 'Post updated.', '投稿を更新しました。', '帖子已更新。'],
  ['게시글을 삭제했습니다.', 'Post deleted.', '投稿を削除しました。', '帖子已删除。'],
  ['댓글 내용을 입력해 주세요.', 'Please enter a comment.', 'コメント内容を入力してください。', '请输入评论内容。']
];

const UI_TRANSLATIONS = {
  ko: {
    'language.selectorLabel': '언어 선택',
    'language.currentLabel': '현재 언어',
    'language.betaBadge': 'Beta'
  },
  en: {
    'language.selectorLabel': 'Language',
    'language.currentLabel': 'Current language',
    'language.betaBadge': 'Beta'
  },
  ja: {
    'language.selectorLabel': '言語選択',
    'language.currentLabel': '現在の言語',
    'language.betaBadge': 'Beta'
  },
  zh: {
    'language.selectorLabel': '语言选择',
    'language.currentLabel': '当前语言',
    'language.betaBadge': 'Beta'
  }
};

function buildTextTranslations() {
  return TRANSLATION_ENTRIES.reduce((acc, [ko, en, ja, zh]) => {
    acc.en[ko] = en;
    acc.ja[ko] = ja;
    acc.zh[ko] = zh;
    return acc;
  }, { en: {}, ja: {}, zh: {} });
}

export const TEXT_TRANSLATIONS = buildTextTranslations();

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.some((option) => option.code === language) ? language : DEFAULT_LANGUAGE;
}

export function getLanguageOption(language) {
  const normalized = normalizeLanguage(language);
  return SUPPORTED_LANGUAGES.find((option) => option.code === normalized) || SUPPORTED_LANGUAGES[0];
}

export function isBetaLanguage(language) {
  return Boolean(getLanguageOption(language).beta);
}

export function languageLabel(language) {
  return getLanguageOption(language).label;
}

export function languageBetaLabel(language) {
  return isBetaLanguage(language) ? 'Beta' : '';
}

export function translateKey(key, language, fallback = key) {
  const normalized = normalizeLanguage(language);
  return UI_TRANSLATIONS[normalized]?.[key] || UI_TRANSLATIONS.ko[key] || fallback || key;
}

export function translateTextValue(value, language) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = normalizeLanguage(language);

  if (normalized === DEFAULT_LANGUAGE || !value.trim()) {
    return value;
  }

  const dictionary = TEXT_TRANSLATIONS[normalized] || {};
  const trimmed = value.trim();
  const exact = dictionary[trimmed];

  if (exact) {
    return value.replace(trimmed, exact);
  }

  return Object.keys(dictionary)
    .sort((a, b) => b.length - a.length)
    .reduce((nextValue, source) => {
      if (!source || !nextValue.includes(source)) {
        return nextValue;
      }

      return nextValue.split(source).join(dictionary[source]);
    }, value);
}
