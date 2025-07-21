import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function SkeletonCategory() {
  return (
    <div className="category-card skeleton">
      <Skeleton height={100} width={100} />
      <Skeleton width={100} />
    </div>
  );
}