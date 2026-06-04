const HELP_TOUR_CONFIG = {
  dashboard: [
    ['dashboard-summary', 'help.dashboard.summary.title', 'help.dashboard.summary.description'],
    ['dashboard-planning', 'help.dashboard.planning.title', 'help.dashboard.planning.description'],
    ['dashboard-quests', 'help.dashboard.quests.title', 'help.dashboard.quests.description']
  ],
  statistics: [
    ['statistics-overview', 'help.statistics.overview.title', 'help.statistics.overview.description'],
    ['statistics-focus-link', 'help.statistics.focusLink.title', 'help.statistics.focusLink.description'],
    ['statistics-pattern', 'help.statistics.pattern.title', 'help.statistics.pattern.description'],
    ['statistics-charts', 'help.statistics.charts.title', 'help.statistics.charts.description']
  ],
  focusTimer: [
    ['focus-timer-overview', 'help.focusTimer.overview.title', 'help.focusTimer.overview.description'],
    ['focus-timer-mode', 'help.focusTimer.mode.title', 'help.focusTimer.mode.description'],
    ['focus-timer-clock', 'help.focusTimer.clock.title', 'help.focusTimer.clock.description'],
    ['focus-timer-actions', 'help.focusTimer.actions.title', 'help.focusTimer.actions.description']
  ],
  aiLearning: [
    ['ai-briefing', 'help.ai.briefing.title', 'help.ai.briefing.description'],
    ['ai-modes', 'help.ai.modes.title', 'help.ai.modes.description'],
    ['ai-workspace', 'help.ai.workspace.title', 'help.ai.workspace.description']
  ],
  schedule: [
    ['schedule-editor', 'help.schedule.editor.title', 'help.schedule.editor.description'],
    ['schedule-list', 'help.schedule.list.title', 'help.schedule.list.description'],
    ['schedule-reminder', 'help.schedule.reminder.title', 'help.schedule.reminder.description']
  ],
  taskBoard: [
    ['taskboard-dday', 'help.taskBoard.dday.title', 'help.taskBoard.dday.description'],
    ['taskboard-editor', 'help.taskBoard.editor.title', 'help.taskBoard.editor.description'],
    ['taskboard-board', 'help.taskBoard.board.title', 'help.taskBoard.board.description']
  ],
  community: [
    ['community-list', 'help.community.list.title', 'help.community.list.description'],
    ['community-actions', 'help.community.actions.title', 'help.community.actions.description'],
    ['community-detail', 'help.community.detail.title', 'help.community.detail.description']
  ],
  pointShop: [
    ['shop-profile', 'help.shop.profile.title', 'help.shop.profile.description'],
    ['shop-items', 'help.shop.items.title', 'help.shop.items.description'],
    ['shop-history', 'help.shop.history.title', 'help.shop.history.description']
  ],
  bossRaid: [
    ['raid-bosses', 'help.raid.bosses.title', 'help.raid.bosses.description'],
    ['raid-parties', 'help.raid.parties.title', 'help.raid.parties.description'],
    ['raid-detail', 'help.raid.detail.title', 'help.raid.detail.description']
  ],
  collaborativeQuest: [
    ['coop-create', 'help.coop.create.title', 'help.coop.create.description'],
    ['coop-list', 'help.coop.list.title', 'help.coop.list.description'],
    ['coop-detail', 'help.coop.detail.title', 'help.coop.detail.description']
  ],
  accessibility: [
    ['accessibility-display', 'help.accessibility.display.title', 'help.accessibility.display.description'],
    ['accessibility-reading', 'help.accessibility.reading.title', 'help.accessibility.reading.description'],
    ['accessibility-magnifier', 'help.accessibility.magnifier.title', 'help.accessibility.magnifier.description']
  ],
  friends: [
    ['friends-search', 'help.friends.search.title', 'help.friends.search.description'],
    ['friends-requests', 'help.friends.requests.title', 'help.friends.requests.description'],
    ['friends-list', 'help.friends.list.title', 'help.friends.list.description']
  ],
  messages: [
    ['messages-threads', 'help.messages.threads.title', 'help.messages.threads.description'],
    ['messages-compose', 'help.messages.compose.title', 'help.messages.compose.description'],
    ['messages-conversation', 'help.messages.conversation.title', 'help.messages.conversation.description']
  ]
};

export function getHelpTourSteps(screen, t) {
  return (HELP_TOUR_CONFIG[screen] || []).map(([targetId, titleKey, descriptionKey]) => ({
    targetId,
    title: t(titleKey, titleKey),
    description: t(descriptionKey, descriptionKey)
  }));
}

export function hasHelpTour(screen) {
  return Boolean(HELP_TOUR_CONFIG[screen]?.length);
}
