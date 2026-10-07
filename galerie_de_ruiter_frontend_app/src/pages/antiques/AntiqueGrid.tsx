import { Col, Row } from "react-bootstrap";
import type Antique from "@/models/antiques/Antique";
import { AntiqueCard } from "./AntiqueCard";

export function AntiqueGrid({ antiques }: { antiques: Antique[] }) {
  return <Row xs={1} md={2} xl={3} className="g-4">
    {antiques.map((antique) => <Col key={antique.id}><AntiqueCard antique={antique} /></Col>)}
  </Row>;
}
