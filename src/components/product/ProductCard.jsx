import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { formatPrice } from '../../utils/price.js';

/**
 * Card representing a product in the list. Shows the primary image,
 * product name and price. Clicking anywhere on the card triggers
 * onOpen (used to open the product dialog) whereas the Add button
 * immediately invokes onAdd if provided.
 */
export default function ProductCard({ product, onOpen, onAdd }) {
  const image = product.images?.[0]?.src;
  return (
    <Card
      elevation={0}
      sx={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,.15)', borderRadius: 2, overflow: 'hidden' }}
    >
      <CardActionArea onClick={() => onOpen?.(product)}>
        {image && (
          <CardMedia component="img" height="140" image={image} alt={product.name} />
        )}
        <CardContent>
          <Typography variant="subtitle1" component="div">
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatPrice(Number(product.price))}
          </Typography>
        </CardContent>
      </CardActionArea>
      {onAdd && (
        <Stack direction="row" justifyContent="flex-end" px={1} pb={1}>
          <Button variant="outlined" size="small" onClick={() => onAdd(product)}>
            Añadir
          </Button>
        </Stack>
      )}
    </Card>
  );
}