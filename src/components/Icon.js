import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

export {
  faBarcode,
  faCartShopping,
  faXmark,
  faMagnifyingGlass,
  faChevronRight,
  faUser,
  faUserPlus,
  faBolt,
  faPrint,
  faArrowLeft,
  faClockRotateLeft,
  faCircleCheck,
  faCircleXmark,
  faTrash,
  faMinus,
  faPlus,
  faRightFromBracket,
  faBars,
  faUsers,
  faTicket,
  faGear,
  faChartBar,
  faBoxesStacked,
  faTruck,
  faFileInvoice,
  faMoneyBillWave,
  faTag,
  faCopyright,
  faShirt,
  faTachometerAlt,
} from '@fortawesome/free-solid-svg-icons';

export default function Icon({ icon, size = 16, color = '#1a1a18', style }) {
  return <FontAwesomeIcon icon={icon} size={size} color={color} style={style} />;
}
