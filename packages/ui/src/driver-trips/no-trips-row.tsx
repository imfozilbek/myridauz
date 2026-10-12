import { Icon } from '../icons';
import './driver-trips.css';
import './no-trips-row.css';

const ICON = 18;

type Props = {
  readonly text: string;
  // In the list of «Oʻtgan»: as wide as the list, over «Obunalar».
  readonly inList?: boolean;
};

// «Faol safar yoʻq» and «Oʻtgan safar yoʻq» (G78 sheet 3): a quiet row, the rest of the screen
// stays under it.
export function NoTripsRow({ text, inList = false }: Props) {
  return (
    <div className={inList ? 'driver-again driver-none driver-none-list' : 'driver-again driver-none'}>
      <span className="driver-again-plus">
        <Icon name="empty" size={ICON} />
      </span>
      <span className="driver-again-text">
        <b>{text}</b>
      </span>
    </div>
  );
}
