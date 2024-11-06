import React, { useEffect } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { withKnobs, number } from '@storybook/addon-knobs';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import README from './README.mdx';
import Segment from './segment';
import { Box } from '../../../components/component-library';
import { StatusTypes } from '../../../../app/scripts/controllers/bridge-status/types';

export default {
  title: 'pages/bridge/transaction-details/Segment',
  component: Segment,
  decorators: [withKnobs],
} as Meta<typeof Segment>;

const types = [StatusTypes.PENDING, StatusTypes.COMPLETE, null];

export const DefaultStory: StoryFn<typeof Segment> = () => {
  const [typeIndex, setType] = React.useState<StatusTypes | null>(
    StatusTypes.PENDING,
  );

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % types.length;
      setType(types[currentIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={1}
      width={BlockSize.Full}
    >
      <Segment type={typeIndex} width={BlockSize.Full} />
    </Box>
  );
};
DefaultStory.storyName = 'Default';
