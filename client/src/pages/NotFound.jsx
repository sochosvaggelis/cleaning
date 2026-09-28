import { Link } from 'react-router';
import { SimpleHeader } from '../components/SimpleHeader.jsx';

export default function NotFound() {
  return (
    <div className="page page--plain">
      <title>Page not found</title>
      <SimpleHeader />
      <main className="container container--narrow page__main">
        <div className="panel">
          <p className="eyebrow">404</p>
          <h1 className="page__title">This page has been washed away.</h1>
          <p>The link may be old or mistyped.</p>
          <Link className="btn btn--primary" to="/">
            Back to the website
          </Link>
        </div>
      </main>
    </div>
  );
}
