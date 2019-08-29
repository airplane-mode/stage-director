/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const SCRIPT_START = "```javascript";
const SCRIPT_END = "```";

const EXAMPLES = {
  STAGE_DIRECTOR: `
${SCRIPT_START}
import StageDirector from "stage-director";

export default new StageDirector("my-app", {
  updateMessage: (state, { message }) => ({
    ...state,
    message
  });
});
${SCRIPT_END}
  `,
  VANILLA_REDUX: `
${SCRIPT_START},
// src/action-types/my-app.js
const UPDATE_MESSAGE = "UPDATE_MESSAGE";

// src/action-creators/my-app.js
import { UPDATE_MESSAGE } from "../action-types/my-app";

export default function updateMessage(message) {
  return {
    type: UPDATE_MESSAGE,
    message
  };
}

// src/reducers/my-app.js
import { UPDATE_MESSAGE } from "../action-types/my-app";

export function myApp(state, action) {
  switch(action.type) {
    case UPDATE_MESSAGE:
      return ({
        ...state,
        message: action.message
      });
    default:
      return state;
  }
}
${SCRIPT_END}

`
};

class HomeSplash extends React.Component {
  render() {
    const {siteConfig, language = ''} = this.props;
    const {baseUrl, docsUrl} = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = props => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const Logo = props => (
      <div className="projectLogo">
        <img src={props.img_src} alt="Project Logo" />
      </div>
    );

    const ProjectTitle = () => (
      <h2 className="projectTitle">
        {siteConfig.title}
        <small>{siteConfig.tagline}</small>
      </h2>
    );

    const PromoSection = props => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = props => (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={props.href} target={props.target}>
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        { false && <Logo img_src={`${baseUrl}img/megaphone.svg`} /> }
        <div className="inner">
          <ProjectTitle siteConfig={siteConfig} />
          <PromoSection>
            <Button href="/docs/getting-started">Get Started</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

class Index extends React.Component {
  render() {
    const {config: siteConfig, language = ''} = this.props;
    const {baseUrl} = siteConfig;

    const Block = props => (
      <Container
        padding={['bottom', 'top']}
        id={props.id}
        background={props.background}>
        <GridBlock
          align="center"
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const FeatureCallout = () => (
      <div className="productShowcaseSection paddingBottom">
        <div className="featureBlock">
          <h3> Simplified </h3>
          <p>
            Stage Director handles the complexity of creating action types, action creators, and reducers for you so you can focus on your application logic instead of redux's framework logic.
            <br/><br/>
            <a className="learn" href="/docs/core-concepts">
              Learn The Core Concepts
            </a>
          </p>
        </div>
        <div className="featureBlock">
          <h3> Asynchronous </h3>
          <p>
            Working async actions out of the box with a massively simplified workflow for defining async actions and handling their responses. Built-in error handling is the cherry on top.
            <br/><br/>
            <a className="learn" href="/docs/async">
              Learn About Async
            </a>
          </p>
        </div>
        <div className="featureBlock">
          <h3> Compatible </h3>
          <p>
            Stage Director generates standard redux actions and reducers so it works with all existing libraries, middleware, and debugging tools. Get all of the benefits of redux without all of the cruft.
          <br/><br/>
          <a className="learn" href="/docs/getting-started">
            Learn How to Integrate it
          </a>
          </p>
        </div>
      </div>
    );

    const TryOut = () => (
      <Block id="try">
        {[
          {
            content:
              'To make your landing page more attractive, use illustrations! Check out ' +
              '[**unDraw**](https://undraw.co/) which provides you with customizable illustrations which are free to use. ' +
              'The illustrations you see on this page are from unDraw.',
            image: `${baseUrl}img/undraw_code_review.svg`,
            imageAlign: 'left',
            title: 'Wonderful SVG Illustrations',
          },
        ]}
      </Block>
    );

    const Description = () => (
      <Block background="dark">
        {[
          {
            content:
              'This is another description of how this project is useful',
            image: `${baseUrl}img/undraw_note_list.svg`,
            imageAlign: 'right',
            title: 'Description',
          },
        ]}
      </Block>
    );

    const LearnHow = () => (
      <Block background="light">
        {[
          {
            content:
              'Each new Docusaurus project has **randomly-generated** theme colors.',
            image: `${baseUrl}img/undraw_youtube_tutorial.svg`,
            imageAlign: 'right',
            title: 'Randomly Generated Theme Colors',
          },
        ]}
      </Block>
    );

    const Comparison = () => (
      <div className="comparison">
        <div className="example">
          <h3> Stage Director </h3>
          <MarkdownBlock>
            { EXAMPLES.STAGE_DIRECTOR }
          </MarkdownBlock>
        </div>
        <div className="example">
          <h3> Vanilla Redux </h3>
          <MarkdownBlock>
            { EXAMPLES.VANILLA_REDUX }
          </MarkdownBlock>
        </div>
      </div>
    );

    const Features = () => (
      <Block layout="fourColumn">
        {[
          {
            content: 'This is the content of my feature',
            image: `${baseUrl}img/undraw_react.svg`,
            imageAlign: 'top',
            title: 'Feature One',
          },
          {
            content: 'The content of my second feature',
            image: `${baseUrl}img/undraw_operating_system.svg`,
            imageAlign: 'top',
            title: 'Feature Two',
          },
        ]}
      </Block>
    );

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter(user => user.pinned)
        .map(user => (
          <a href={user.infoLink} key={user.infoLink}>
            <img src={user.image} alt={user.caption} title={user.caption} />
          </a>
        ));

      const pageUrl = page => baseUrl + (language ? `${language}/` : '') + page;

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Who is Using This?</h2>
          <p>This project is used by all these people</p>
          <div className="logos">{showcase}</div>
          <div className="more-users">
            <a className="button" href={pageUrl('users.html')}>
              More {siteConfig.title} Users
            </a>
          </div>
        </div>
      );
    };

    return (
      <div>
        <HomeSplash siteConfig={siteConfig} language={language} />
        <div className="mainContainer">
          <Comparison />
          <FeatureCallout />
        </div>
      </div>
    );
  }
}

module.exports = Index;
