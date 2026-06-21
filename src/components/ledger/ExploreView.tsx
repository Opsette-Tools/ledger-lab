import { Col, Row } from "antd";
import { ActionsPanel } from "./ActionsPanel";
import { JournalPanel } from "./JournalPanel";
import { ReportsPanel } from "./ReportsPanel";

/**
 * Free-play surface — drive the books yourself, after the training wheels of
 * Basics and Learn. The layout follows the actual flow of what you're doing,
 * top to bottom:
 *
 *   1. Record an event  +  2. See the journal entry it created (with its
 *      plain-English "what just happened" right under the header) — side by side
 *   3. Watch it roll up into the financial reports — full width below
 *
 * No more three cramped columns or reports hidden in a narrow tabbed strip.
 */
export function ExploreView() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={10}>
        <ActionsPanel />
      </Col>
      <Col xs={24} lg={14}>
        <JournalPanel />
      </Col>
      <Col xs={24}>
        <ReportsPanel />
      </Col>
    </Row>
  );
}
