import LegalPage from '../components/LegalPage';
import { legalDocuments } from '../../shared/legal';
export default function PurchaseTerms() { return <LegalPage document={legalDocuments[1]}/>; }
