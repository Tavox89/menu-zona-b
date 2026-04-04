import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';

export default function BrandTransitionOverlay({ visible = false, fading = false }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const skeletonBg = alpha(theme.palette.text.primary, isLight ? 0.08 : 0.12);

  if (!visible) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (currentTheme) => currentTheme.zIndex.tooltip + 20,
        pointerEvents: 'none',
        opacity: fading ? 0 : 1,
        transition: 'opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        background: alpha(theme.palette.background.default, isLight ? 0.46 : 0.58),
        backdropFilter: 'blur(16px)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: theme.appBrand.appBackground,
          opacity: 0.94,
        }}
      />
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          pt: { xs: 3, sm: 4 },
          pb: 6,
        }}
      >
        <Stack spacing={{ xs: 2.5, sm: 3 }}>
          <Stack spacing={1.75} alignItems="center">
            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{
                bgcolor: skeletonBg,
                borderRadius: 3,
              }}
              width={theme.palette.mode === 'light' ? 210 : 190}
              height={theme.palette.mode === 'light' ? 56 : 64}
            />
            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{
                width: 'min(100%, 720px)',
                maxWidth: '100%',
                height: { xs: 54, sm: 60 },
                bgcolor: skeletonBg,
                borderRadius: 999,
              }}
            />
            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{
                width: { xs: 196, sm: 228 },
                height: { xs: 46, sm: 50 },
                bgcolor: skeletonBg,
                borderRadius: 3,
              }}
            />
          </Stack>

          <Box
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.appBrand.softBorderColor}`,
              background: theme.appBrand.frostedPanel,
              px: { xs: 1.2, sm: 1.6 },
              py: { xs: 1.1, sm: 1.3 },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  animation="wave"
                  sx={{
                    bgcolor: skeletonBg,
                    borderRadius: 999,
                  }}
                  width={index % 2 === 0 ? 104 : 138}
                  height={34}
                />
              ))}
            </Stack>
          </Box>

          <Grid container spacing={{ xs: 1.25, sm: 2 }} justifyContent="center">
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    width: '100%',
                    minHeight: 124,
                    borderRadius: 2.5,
                    border: `1px solid ${theme.appBrand.softBorderColor}`,
                    background: theme.appBrand.cardBackground,
                    p: { xs: 1, sm: 1.2 },
                    display: 'flex',
                    gap: 1,
                    boxShadow: isLight
                      ? '0 18px 36px rgba(36,56,76,0.08)'
                      : '0 18px 36px rgba(0,0,0,0.12)',
                  }}
                >
                  <Skeleton
                    variant="rounded"
                    animation="wave"
                    sx={{
                      flexShrink: 0,
                      width: { xs: 84, sm: 96 },
                      height: { xs: 84, sm: 96 },
                      borderRadius: 1.25,
                      bgcolor: skeletonBg,
                    }}
                  />
                  <Stack spacing={1} sx={{ flex: 1, pt: 0.5 }}>
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
                      width="78%"
                      height={18}
                    />
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
                      width="34%"
                      height={16}
                    />
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
                      width="44%"
                      height={14}
                    />
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
