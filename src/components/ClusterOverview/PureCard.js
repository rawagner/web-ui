import React from 'react';

export class PureCard extends React.Component {
  constructor(props, watchedPropKeys) {
    super(props);
    this.watchedPropKeys = watchedPropKeys;
  };

  shouldComponentUpdate(prevProps) {
    return !this.watchedPropKeys.every(key => prevProps[key] === this.props[key])
  };
};
