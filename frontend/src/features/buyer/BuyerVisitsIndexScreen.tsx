import ApkScreen from '../apk/ApkScreen';

/** Buyer Visits Index Screen. UI and actions live in this feature's browser source. */
export default function BuyerVisitsIndexScreen() {
  return (
    <ApkScreen
      entry="buyer"
      page="parcelVisits"
      pageArgs={{}}
    />
  );
}
