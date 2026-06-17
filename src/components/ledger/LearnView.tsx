import { Col, Row } from "antd";
import { LessonPlayer } from "./LessonPlayer";
import { RevenueChart } from "./RevenueChart";

/**
 * The guided-lesson surface. The lesson leads (intro → step + inline narration
 * → takeaway), and the revenue chart sits beside it as the visible payoff —
 * the thing the lesson's actions actually move. They share a row so the chart
 * reads as part of the lesson, not a disconnected side card.
 */
export function LearnView() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={15}>
        <LessonPlayer />
      </Col>
      <Col xs={24} lg={9}>
        <RevenueChart />
      </Col>
    </Row>
  );
}
