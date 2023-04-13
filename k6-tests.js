import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  scenarios: {
    one_rps: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 1,
    },
    ten_rps: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 10,
    },
    hundred_rps: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 100,
    },
    onek_rps: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 1000,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<50'], // 95% of requests should be faster than 50ms
  },
};

export default function () {
  const productId = 950031; // Replace this with a product ID in the last 10% of your dataset
  const apiUrl = 'http://localhost:3000'; // Replace this with the appropriate API URL

  group('GET /reviews', () => {
    const res = http.get(`${apiUrl}/reviews?product_id=${productId}`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('GET /reviews/meta', () => {
    const res = http.get(`${apiUrl}/reviews/meta?product_id=${productId}`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  sleep(1);
}
