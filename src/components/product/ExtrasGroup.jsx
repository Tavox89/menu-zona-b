import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { formatPrice } from '../../utils/price.js';

/**
 * Render a group of extra options. The group decides whether to
 * allow multiple selections (checkboxes) or a single selection (radio).
 *
 * Props:
 * - group: ExtraGroup { groupId, label, multiple, options }
 * - selected: current selection (string or array of strings)
 * - onChange: function(value) called when user selects/deselects an option
 */
export default function ExtrasGroup({ group, selected, onChange }) {
  if (!group || !group.options?.length) return null;
  const { label, options, multiple } = group;
  const selectedValue = selected || (multiple ? [] : '');
  return (
    <FormControl component="fieldset" sx={{ mb: 2 }}>
      {label && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      {multiple ? (
        <FormGroup>
          {options.map((opt) => (
            <FormControlLabel
              key={opt.id}
              control={
                <Checkbox
                  checked={Array.isArray(selectedValue) && selectedValue.includes(opt.id)}
                  onChange={() => onChange(opt.id)}
                />
              }
              label={`${opt.label}${opt.price > 0 ? ` (+${formatPrice(opt.price)})` : ''}`}
            />
          ))}
        </FormGroup>
      ) : (
        <RadioGroup value={selectedValue} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <FormControlLabel
              key={opt.id}
              value={opt.id}
              control={<Radio />}
              label={`${opt.label}${opt.price > 0 ? ` (+${formatPrice(opt.price)})` : ''}`}
            />
          ))}
        </RadioGroup>
      )}
    </FormControl>
  );
}