import LegalPage from '../components/LegalPage';
import { legalDocuments } from '../../shared/legal';
export default function Returns() { return <LegalPage document={legalDocuments[2]}/>; }
