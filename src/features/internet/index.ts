import { TerminalFeature } from '../featureTypes';
import { Command } from '../../terminal/types/commands';
import { searchWeb } from './search-web';

const InternetFeature: TerminalFeature = {
  async loadFeatureCommands(): Promise<Command[]> {
    return [searchWeb];
  }
};

export default InternetFeature;