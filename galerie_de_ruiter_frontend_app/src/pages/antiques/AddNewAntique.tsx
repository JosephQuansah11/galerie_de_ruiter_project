import { Container , Card } from "react-bootstrap";
import { AddForm } from "@/components/common/AddForm";



export default function AddNewAntique() {
  const antiqueForm = {
    title: "",
    artistId: "",
    description: "",
    price: 0.0,
  };
  return (
    <Container className="card p-5">
      <Card.Header className="bg-primary text-white">
        <h2 className="mb-0">
          <i className="bi bi-person-plus me-2"></i>
          Add Antique
        </h2>
      </Card.Header>
      <AddForm items={antiqueForm} buttonName="Add New  Antique Item" />
    </Container>
  );
}
