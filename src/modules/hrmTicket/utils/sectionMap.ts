/**
 * Ticket module section → backend objectName mapping.
 *
 * `ticket_module` is the ROOT object (module-level V/A/E/D). The rest split the module by who
 * needs them: every employee raises and reads through `ticket_record`, agents work the queue,
 * leads assign, administrators configure, and only report holders see the whole site.
 */
export const hrmTicketSectionMap: Record<string, string> = {
  module: 'ticket_module',
  ticket: 'ticket_record',
  queue: 'ticket_queue',
  assign: 'ticket_assign',
  category: 'ticket_category',
  report: 'ticket_report',
};
