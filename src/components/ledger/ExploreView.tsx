import { Col, Row } from "antd";
import { ActionsPanel } from "./ActionsPanel";
import { JournalPanel } from "./JournalPanel";
import { ReportsTabs } from "./ReportsTabs";

/**
 * Free-play surface: record any event yourself, watch it land in the journal,
 * and inspect the four reports (tabbed, so no endless scroll). For the learner
 * who's ready to drive the books rather than follow a script.
 */
export function ExploreView() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <ActionsPanel />
      </Col>
      <Col xs={24} lg={9}>
        <JournalPanel />
      </Col>
      <Col xs={24} lg={7}>
        <ReportsTabs />
      </Col>
    </Row>
  );
}
