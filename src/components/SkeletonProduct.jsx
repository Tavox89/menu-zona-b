import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function SkeletonProduct() {
  return (
    <div className="product-card skeleton">
      <Skeleton height={140} />
      <Skeleton count={2} />
    </div>
  );
}