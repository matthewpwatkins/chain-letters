import Container from 'react-bootstrap/Container';
// https://fontawesome.com/docs/web/use-with/react/add-icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import Nav from 'react-bootstrap/Nav';
import { Badge } from 'react-bootstrap';

export const Footer = (props) => {
  return <Container fluid className="app-container footer py-2 mt-auto">
    <p className="text-secondary text-center" style={{ fontSize: "smaller" }}>
      <Badge bg="light" text="dark" className="me-2">{props.version}</Badge> &copy; {new Date().getFullYear()} Matthew Watkins
    </p>
    <hr />
    <Nav fill>
      <Nav.Item>
        <Nav.Link href="https://watkins.dev" target="_blank">
          <FontAwesomeIcon icon={solid("user")} className="me-1" /> About
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link href="https://paypal.me/watkinsmatthewp" target="_blank">
          <FontAwesomeIcon icon={solid("hand-holding-dollar")} className="me-1" /> Donate
        </Nav.Link>
      </Nav.Item>
    </Nav>
  </Container >;
};