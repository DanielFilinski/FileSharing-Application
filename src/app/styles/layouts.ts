import { styled } from "styled-components";

const PADDING = 16;

const ScreenContainer = styled.div`
  padding: 0px;
  margin: 0px;
`;

const HeaderContainer = styled.header`
  padding: ${PADDING}px;
`;

const ContentContainer = styled.main`
  padding: ${PADDING}px;
`;

const FooterContainer = styled.footer`
  padding: ${PADDING}px;
`;

export { 
    ScreenContainer, 
    HeaderContainer, 
    ContentContainer, 
    FooterContainer 
};