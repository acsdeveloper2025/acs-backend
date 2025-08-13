import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/utils';
import {
  LoadingSpinner,
  LoadingOverlay,
  LoadingCard,
  LoadingSkeleton,
  LoadingButton,
} from '../loading';

describe('Loading Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      renderWithProviders(<LoadingSpinner />);
      
      const spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin', 'h-6', 'w-6');
    });

    it('renders with different sizes', () => {
      const { rerender } = renderWithProviders(<LoadingSpinner size="sm" />);
      
      let spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toHaveClass('h-4', 'w-4');

      rerender(<LoadingSpinner size="lg" />);
      spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toHaveClass('h-8', 'w-8');

      rerender(<LoadingSpinner size="xl" />);
      spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toHaveClass('h-12', 'w-12');
    });

    it('renders with dots variant', () => {
      renderWithProviders(<LoadingSpinner variant="dots" />);
      
      const dots = screen.getAllByRole('generic');
      expect(dots).toHaveLength(3);
      dots.forEach(dot => {
        expect(dot).toHaveClass('animate-bounce');
      });
    });

    it('renders with pulse variant', () => {
      renderWithProviders(<LoadingSpinner variant="pulse" />);
      
      const pulse = screen.getByRole('generic');
      expect(pulse).toHaveClass('animate-pulse');
    });

    it('renders with bounce variant', () => {
      renderWithProviders(<LoadingSpinner variant="bounce" />);
      
      const bounce = screen.getByRole('generic');
      expect(bounce).toHaveClass('animate-bounce');
    });
  });

  describe('LoadingOverlay', () => {
    it('shows overlay when loading', () => {
      renderWithProviders(
        <LoadingOverlay isLoading={true} loadingText="Loading data...">
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('hides overlay when not loading', () => {
      renderWithProviders(
        <LoadingOverlay isLoading={false} loadingText="Loading data...">
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('uses default loading text', () => {
      renderWithProviders(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('LoadingCard', () => {
    it('renders with default props', () => {
      renderWithProviders(<LoadingCard />);
      
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('renders with custom title and description', () => {
      renderWithProviders(
        <LoadingCard title="Custom Loading" description="Please wait..." />
      );
      
      expect(screen.getByText('Custom Loading')).toBeInTheDocument();
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });
  });

  describe('LoadingSkeleton', () => {
    it('renders rectangular skeleton by default', () => {
      renderWithProviders(<LoadingSkeleton />);
      
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveClass('animate-pulse', 'bg-muted', 'rounded');
    });

    it('renders text skeleton with multiple lines', () => {
      renderWithProviders(<LoadingSkeleton variant="text" lines={3} />);
      
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons).toHaveLength(4); // 3 lines + container
      expect(skeletons[0]).toHaveClass('space-y-2');
    });

    it('renders circular skeleton', () => {
      renderWithProviders(<LoadingSkeleton variant="circular" />);
      
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('applies custom dimensions', () => {
      renderWithProviders(
        <LoadingSkeleton width="200px" height="100px" />
      );
      
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveStyle({
        width: '200px',
        height: '100px',
      });
    });
  });

  describe('LoadingButton', () => {
    it('shows loading state', () => {
      renderWithProviders(
        <LoadingButton isLoading={true} loadingText="Processing...">
          Submit
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('shows normal state when not loading', () => {
      renderWithProviders(
        <LoadingButton isLoading={false}>
          Submit
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('handles click events when not loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(
        <LoadingButton isLoading={false} onClick={handleClick}>
          Submit
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not handle click events when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(
        <LoadingButton isLoading={true} onClick={handleClick}>
          Submit
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('uses default loading text', () => {
      renderWithProviders(
        <LoadingButton isLoading={true}>
          Submit
        </LoadingButton>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('applies different variants', () => {
      const { rerender } = renderWithProviders(
        <LoadingButton isLoading={false} variant="destructive">
          Delete
        </LoadingButton>
      );
      
      let button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');

      rerender(
        <LoadingButton isLoading={false} variant="outline">
          Cancel
        </LoadingButton>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });
  });
});
