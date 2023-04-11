const db = require('../db/connection.js')
const request = require('supertest')
const app = require('../app.js')
const {
  categoryData,
  commentData,
  reviewData,
  userData,
} = require('../db/data/test-data/index.js')
const seed = require('../db/seeds/seed.js')

beforeEach(() => {
  return seed({ categoryData, commentData, reviewData, userData })
})
afterAll(() => {
  return db.end()
})

describe('app', () => {
  describe('Valid but non-existent path', () => {
    test('404: ANY request for non-existent path responds with Path not found', () => {
      return request(app)
        .get('/api/path_that_doesnt_exist')
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Path not found')
        })
    })
  })

  describe('api', () => {
    test('200: GET request responds with JSON describing all endpoints', () => {
      return request(app)
        .get('/api')
        .expect(200)
        .then(({ body: { endpoints } }) => {
          expect(endpoints).toBeInstanceOf(Object)
          expect(endpoints).toHaveProperty('GET /api')
          expect(endpoints).toHaveProperty('GET /api/categories')
          expect(endpoints).toHaveProperty('GET /api/reviews')
          expect(endpoints).toHaveProperty('GET /api/reviews/:review_id')
          expect(endpoints).toHaveProperty('GET /api/users')
          expect(endpoints).toHaveProperty('PATCH /api/reviews/:review_id')
          expect(endpoints).toHaveProperty(
            'POST /api/reviews/:review_id/comments'
          )
          expect(endpoints).toHaveProperty('DELETE /api/comments/:comment_id')
          for (const endpoint in endpoints) {
            expect(endpoints[endpoint]).toHaveProperty('description')
            if (endpoint.startsWith('GET /api/')) {
              expect(endpoints[endpoint]).toHaveProperty('exampleResponse')
              expect(endpoints[endpoint]).toHaveProperty('queries')
            }
            if (endpoint.startsWith('POST') || endpoint.startsWith('PATCH')) {
              expect(endpoints[endpoint]).toHaveProperty('exampleRequestBody')
            }
          }
        })
    })
  })

  describe('getCategories', () => {
    test('200: GET request responds with array of category objects', () => {
      return request(app)
        .get('/api/categories')
        .expect(200)
        .then(({ body: { categories } }) => {
          expect(categories).toHaveLength(4)
          categories.forEach((category) => {
            expect(category).toMatchObject({
              slug: expect.any(String),
              description: expect.any(String),
            })
          })
        })
    })
  })

  describe('getReviews', () => {
    describe('no query', () => {
      test('200: GET request responds with array of review objects', () => {
        return request(app)
          .get('/api/reviews')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(10)
            reviews.forEach((review) =>
              expect(review).toMatchObject({
                owner: expect.any(String),
                title: expect.any(String),
                review_id: expect.any(Number),
                category: expect.any(String),
                review_img_url: expect.any(String),
                created_at: expect.any(String),
                votes: expect.any(Number),
                designer: expect.any(String),
                comment_count: expect.any(Number),
              })
            )
            expect(reviews).toBeSortedBy('created_at', { descending: true })
          })
      })
    })
    describe('category query', () => {
      test('200: GET request returns reviews filtered by given category', () => {
        return request(app)
          .get('/api/reviews?category=euro+game')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(1)
            expect(reviews[0]).toMatchObject({
              owner: 'mallionaire',
              title: 'Agricola',
              review_id: expect.any(Number),
              category: 'euro game',
              review_img_url:
                'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg?w=700&h=700',
              created_at: expect.any(String),
              votes: 1,
              designer: expect.any(String),
              comment_count: expect.any(Number),
            })
          })
      })
      test('200: GET request returns empty array if category doesnt exist', () => {
        return request(app)
          .get('/api/reviews?category=cat_that_doesnt_exist')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toBeInstanceOf(Array)
            expect(reviews).toHaveLength(0)
          })
      })
      test('200: GET request returns empty array if no reviews with that category', () => {
        return request(app)
          .get("/api/reviews?category=children's+games")
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toBeInstanceOf(Array)
            expect(reviews).toHaveLength(0)
          })
      })
    })
    describe('sort_by query', () => {
      test('200: GET request responds with array of review objects sorted by sort_by query', () => {
        return request(app)
          .get('/api/reviews?sort_by=owner')
          .expect(200)
          .then(({ body: { reviews } }) => {
            reviews.forEach((review) =>
              expect(review).toEqual(
                expect.objectContaining({
                  owner: expect.any(String),
                  title: expect.any(String),
                  review_id: expect.any(Number),
                  category: expect.any(String),
                  review_img_url: expect.any(String),
                  created_at: expect.any(String),
                  votes: expect.any(Number),
                  designer: expect.any(String),
                  comment_count: expect.any(Number),
                })
              )
            )
            expect(reviews).toBeSortedBy('owner', { descending: true })
          })
      })
      test('400: GET request with invalid sort_by returns invalid request', () => {
        return request(app)
          .get('/api/reviews?sort_by=invalid_key')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Invalid key to sort by')
          })
      })
    })
    describe('order_by query', () => {
      test('200: GET request with order_by returns ascending list', () => {
        return request(app)
          .get('/api/reviews?order_by=asc')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toBeSortedBy('created_at')
          })
      })
      test('400: GET request with invalid order_by returns invalid request', () => {
        return request(app)
          .get('/api/reviews?order_by=invalid')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Invalid order by')
          })
      })
    })
    describe('limit query', () => {
      test('200: GET request returns array of length limit', () => {
        return request(app)
          .get('/api/reviews?limit=3')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(3)
          })
      })
      test('400: GET request with invalid limit returns invalid request', () => {
        return request(app)
          .get('/api/reviews?limit=invalid')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Invalid request')
          })
      })
      test('400: GET request with negative limit returns invalid request', () => {
        return request(app)
          .get('/api/reviews?limit=-1')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Limit must not be negative')
          })
      })
      test('200: GET request with limit larger than table', () => {
        return request(app)
          .get('/api/reviews?limit=300')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(13)
          })
      })
    })
    describe('page query', () => {
      test('200: GET returns second page', () => {
        return request(app)
          .get('/api/reviews?p=2')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(3)
          })
      })
      test('200: GET returns empty array if no results on page', () => {
        return request(app)
          .get('/api/reviews?p=20')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(0)
          })
      })
      test('400: GET request with negative p returns invalid request', () => {
        return request(app)
          .get('/api/reviews?p=-1')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Page number must not be negative')
          })
      })
      test('400: GET request with invalid p returns invalid request', () => {
        return request(app)
          .get('/api/reviews?p=invalid')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Invalid request')
          })
      })
    })
    describe('total_count property added to returned object', () => {
      test('200: GET returned with total_count property', () => {
        return request(app)
          .get('/api/reviews')
          .expect(200)
          .then(({ body: { reviews } }) => {
            reviews.forEach((review) => {
              expect(review).toHaveProperty('total_count', 13)
            })
          })
      })
    })
    describe('multiple queries', () => {
      test('200: GET returns a list sorted and ordered', () => {
        return request(app)
          .get('/api/reviews?order_by=asc&sort_by=owner')
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toBeSortedBy('owner')
          })
      })
      test('200: GET returns a sorted, ordered and filtered list', () => {
        return request(app)
          .get(
            '/api/reviews?order_by=desc&sort_by=title&category=social+deduction'
          )
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews.length > 1).toBe(true)
            reviews.forEach((review) => {
              expect(review.category).toBe('social deduction')
            })
            expect(reviews).toBeSortedBy('title', { descending: true })
          })
      })
      test('200: GET returns page 3 of a filtered, limited list with total_count', () => {
        return request(app)
          .get(
            '/api/reviews?category=social+deduction&limit=3&p=3&sort_by=review_id&order_by=asc'
          )
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(3)
            const firstReview = reviews[0]
            expect(firstReview.total_count).toBe(11)
            expect(firstReview.review_id).toBe(9)
          })
      })
    })
  })

  describe('getReview', () => {
    test('200: GET request responds with a review object', () => {
      return request(app)
        .get('/api/reviews/2')
        .expect(200)
        .then(({ body: { review } }) => {
          expect(review).toEqual({
            review_id: 2,
            title: 'Jenga',
            designer: 'Leslie Scott',
            owner: 'philippaclaire9',
            review_img_url:
              'https://images.pexels.com/photos/4473494/pexels-photo-4473494.jpeg?w=700&h=700',
            review_body: 'Fiddly fun for all the family',
            category: 'dexterity',
            created_at: '2021-01-18T10:01:41.251Z',
            votes: 5,
            comment_count: 3,
          })
        })
    })
    test('404: GET request with an id out of range returns "Not Found"', () => {
      return request(app)
        .get('/api/reviews/10000')
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Review not found')
        })
    })
    test('400: GET request with Invalid request returns bad request', () => {
      return request(app)
        .get('/api/reviews/bananas')
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Invalid request')
        })
    })
  })

  describe('getComments', () => {
    describe('no query', () => {
      test('200: GET request responds with an array of comments', () => {
        return request(app)
          .get('/api/reviews/2/comments')
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toHaveLength(3)
            comments.forEach((comment) => {
              expect(comment).toMatchObject({
                comment_id: expect.any(Number),
                votes: expect.any(Number),
                created_at: expect.any(String),
                author: expect.any(String),
                body: expect.any(String),
                review_id: expect.any(Number),
              })
            })
            expect(comments).toBeSortedBy('votes', { descending: true })
          })
      })
      test('200: GET request where review id has no comments', () => {
        return request(app)
          .get('/api/reviews/1/comments')
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toBeInstanceOf(Array)
            expect(comments).toHaveLength(0)
          })
      })
      test('404: GET request with an id out of range returns "Not Found"', () => {
        return request(app)
          .get('/api/reviews/10000/comments')
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('review_id not found')
          })
      })
      test('400: GET request with Invalid request returns bad request', () => {
        return request(app)
          .get('/api/reviews/bananas/comments')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Invalid request')
          })
      })
    })
    describe('limit query', () => {
      test('200: GET request returns array of length limit', () => {
        return request(app)
          .get('/api/reviews/2/comments?limit=1')
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toHaveLength(1)
          })
      })
      test('400: GET request with invalid limit returns invalid request', () => {
        return request(app)
          .get('/api/reviews/2/comments?limit=invalid')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Invalid request')
          })
      })
      test('400: GET request with negative limit returns invalid request', () => {
        return request(app)
          .get('/api/reviews/2/comments?limit=-1')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Limit must not be negative')
          })
      })
      test('200: GET request with limit larger than table', () => {
        return request(app)
          .get('/api/reviews/2/comments?limit=300')
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toHaveLength(3)
          })
      })
    })
    describe('page query', () => {
      test('200: GET returns second page', () => {
        return request(app)
          .get('/api/reviews/2/comments?limit=2&p=2')
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toHaveLength(1)
            expect(comments[0].comment_id).toBe(5)
          })
      })
      test('200: GET returns empty array if no results on page', () => {
        return request(app)
          .get('/api/reviews/2/comments?p=20')
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toHaveLength(0)
          })
      })
      test('400: GET request with negative p returns invalid request', () => {
        return request(app)
          .get('/api/reviews/2/comments?p=-1')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Page number must not be negative')
          })
      })
      test('400: GET request with invalid p returns invalid request', () => {
        return request(app)
          .get('/api/reviews/2/comments?p=invalid')
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe('Invalid request')
          })
      })
    })
  })

  describe('postComments', () => {
    test('201: POST request responds with comment object', () => {
      return request(app)
        .post('/api/reviews/1/comments')
        .send({ username: 'mallionaire', body: 'The best game ever!' })
        .expect(201)
        .then(({ body: { comment } }) => {
          expect(comment).toEqual({
            comment_id: 7,
            body: 'The best game ever!',
            votes: 0,
            author: 'mallionaire',
            review_id: 1,
            created_at: expect.any(String),
          })
        })
    })
    test('201: POST request responds with comment object ignoring extra properties', () => {
      return request(app)
        .post('/api/reviews/1/comments')
        .send({
          username: 'mallionaire',
          body: 'The best game ever!',
          extra: 'ignored!',
        })
        .expect(201)
        .then(({ body: { comment } }) => {
          expect(comment).toEqual({
            comment_id: 7,
            body: 'The best game ever!',
            votes: 0,
            author: 'mallionaire',
            review_id: 1,
            created_at: expect.any(String),
          })
        })
    })

    test('404: POST request with an id out of range', () => {
      return request(app)
        .post('/api/reviews/10000/comments')
        .send({ username: 'mallionaire', body: 'The best game ever!' })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe(
            'Key (review_id)=(10000) is not present in table "reviews".'
          )
        })
    })
    test('404: POST request with a username that does not exist', () => {
      return request(app)
        .post('/api/reviews/1/comments')
        .send({ username: 'Erin', body: 'The best game ever!' })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe(
            'Key (author)=(Erin) is not present in table "users".'
          )
        })
    })
    test('400: POST request with Invalid request', () => {
      return request(app)
        .post('/api/reviews/bananas/comments')
        .send({ username: 'mallionaire', body: 'The best game ever!' })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Invalid request')
        })
    })
    test('400: POST request with empty object (or missing username/body)', () => {
      return request(app)
        .post('/api/reviews/1/comments')
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Missing key information from body')
        })
    })
  })

  describe('patchReview', () => {
    test('200: PATCH request responds with updated review with incremented votes', () => {
      return request(app)
        .patch('/api/reviews/2')
        .send({ inc_votes: 2 })
        .expect(200)
        .then(({ body: { review } }) => {
          expect(review).toEqual({
            review_id: 2,
            title: 'Jenga',
            designer: 'Leslie Scott',
            owner: 'philippaclaire9',
            review_img_url:
              'https://images.pexels.com/photos/4473494/pexels-photo-4473494.jpeg?w=700&h=700',
            review_body: 'Fiddly fun for all the family',
            category: 'dexterity',
            created_at: '2021-01-18T10:01:41.251Z',
            votes: 7,
          })
        })
    })
    test('200: PATCH request responds with updated review with decremented votes', () => {
      return request(app)
        .patch('/api/reviews/2')
        .send({ inc_votes: -2 })
        .expect(200)
        .then(({ body: { review } }) => {
          expect(review).toEqual({
            review_id: 2,
            title: 'Jenga',
            designer: 'Leslie Scott',
            owner: 'philippaclaire9',
            review_img_url:
              'https://images.pexels.com/photos/4473494/pexels-photo-4473494.jpeg?w=700&h=700',
            review_body: 'Fiddly fun for all the family',
            category: 'dexterity',
            created_at: '2021-01-18T10:01:41.251Z',
            votes: 3,
          })
        })
    })
    test('200: PATCH request responds with updated review, ignoring extra keys', () => {
      return request(app)
        .patch('/api/reviews/2')
        .send({ inc_votes: -2, another_key: 'hello' })
        .expect(200)
        .then(({ body: { review } }) => {
          expect(review).toEqual({
            review_id: 2,
            title: 'Jenga',
            designer: 'Leslie Scott',
            owner: 'philippaclaire9',
            review_img_url:
              'https://images.pexels.com/photos/4473494/pexels-photo-4473494.jpeg?w=700&h=700',
            review_body: 'Fiddly fun for all the family',
            category: 'dexterity',
            created_at: '2021-01-18T10:01:41.251Z',
            votes: 3,
          })
        })
    })
    test('404: PATCH request responds with review id not found', () => {
      return request(app)
        .patch('/api/reviews/1000')
        .send({ inc_votes: 2 })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('review_id not found')
        })
    })
    test('400: PATCH request responds with missing key', () => {
      return request(app)
        .patch('/api/reviews/1')
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Missing key information from body')
        })
    })
    test('400: PATCH request with invalid data-type for increment', () => {
      return request(app)
        .patch('/api/reviews/1')
        .send({ inc_votes: 'kev' })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Invalid request')
        })
    })
    test('400: PATCH request with Invalid request returns bad request', () => {
      return request(app)
        .patch('/api/reviews/bananas')
        .send({ inc_votes: 2 })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Invalid request')
        })
    })
  })

  describe('getUsers', () => {
    test('200: GET request responds with array of users', () => {
      return request(app)
        .get('/api/users')
        .expect(200)
        .then(({ body: { users } }) => {
          expect(users).toHaveLength(4)
          users.forEach((user) => {
            expect(user).toMatchObject({
              username: expect.any(String),
              name: expect.any(String),
              avatar_url: expect.any(String),
            })
          })
        })
    })
  })

  describe('deleteComment', () => {
    test('204: DELETE returns no content', () => {
      return request(app).delete('/api/comments/2').expect(204)
    })
    test('404: DELETE returns comment_id not found, if it does not exist', () => {
      return request(app)
        .delete('/api/comments/100')
        .expect(404)
        .then(({ body: { msg } }) => expect(msg).toBe('comment_id not found'))
    })
    test('400: DELETE returns invalid request', () => {
      return request(app)
        .delete('/api/comments/invalid')
        .expect(400)
        .then(({ body: { msg } }) => expect(msg).toBe('Invalid request'))
    })
  })

  describe('patchComment', () => {
    test('200: PATCH returns updated comment with updated votes', () => {
      return request(app)
        .patch('/api/comments/3')
        .send({ inc_votes: 3 })
        .expect(200)
        .then(({ body: { comment } }) => {
          expect(comment).toMatchObject({
            comment_id: 3,
            body: "I didn't know dogs could play games",
            votes: 13,
            author: 'philippaclaire9',
            review_id: 3,
            created_at: expect.any(String),
          })
        })
    })
    test('200: PATCH returns updated comment with updated votes ignoring extra keys', () => {
      return request(app)
        .patch('/api/comments/3')
        .send({ inc_votes: 3, anything: 'test' })
        .expect(200)
        .then(({ body: { comment } }) => {
          expect(comment).toMatchObject({
            comment_id: 3,
            body: "I didn't know dogs could play games",
            votes: 13,
            author: 'philippaclaire9',
            review_id: 3,
            created_at: expect.any(String),
          })
        })
    })
    test('404: PATCH returns comment not found', () => {
      return request(app)
        .patch('/api/comments/3000')
        .send({ inc_votes: 3 })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Comment not found')
        })
    })
    test('400: PATCH request responds with missing key', () => {
      return request(app)
        .patch('/api/comments/2')
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Missing key information from body')
        })
    })
    test('400: PATCH request with invalid data-type for increment', () => {
      return request(app)
        .patch('/api/comments/2')
        .send({ inc_votes: 'NAN' })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Invalid request')
        })
    })
  })

  describe('getUser', () => {
    test('200: GET returns user', () => {
      return request(app)
        .get('/api/users/bainesface')
        .expect(200)
        .then(({ body: { user } }) => {
          expect(user).toHaveProperty('username', 'bainesface')
          expect(user).toHaveProperty('name', 'sarah')
          expect(user).toHaveProperty(
            'avatar_url',
            'https://avatars2.githubusercontent.com/u/24394918?s=400&v=4'
          )
        })
    })
    test('404: GET returns username not found', () => {
      return request(app)
        .get('/api/users/fake-user')
        .expect(404)
        .then(({ body: { msg } }) => expect(msg).toBe('User not found'))
    })
  })

  describe('postReview', () => {
    test('200: POST returns new review', () => {
      return request(app)
        .post('/api/reviews')
        .send({
          owner: 'philippaclaire9',
          title: 'Takenoko',
          review_body: 'Fun with pandas!',
          designer: 'unknown',
          category: 'dexterity',
          review_img_url: 'https://fake-address.fake.com',
        })
        .expect(201)
        .then(({ body: { review } }) => {
          expect(review).toMatchObject({
            review_id: 14,
            title: 'Takenoko',
            designer: 'unknown',
            owner: 'philippaclaire9',
            review_img_url: 'https://fake-address.fake.com',
            review_body: 'Fun with pandas!',
            category: 'dexterity',
            created_at: expect.any(String),
            votes: 0,
            comment_count: 0,
          })
        })
    })
    test('200: POST returns new review with default url', () => {
      return request(app)
        .post('/api/reviews')
        .send({
          owner: 'philippaclaire9',
          title: 'Takenoko',
          review_body: 'Fun with pandas!',
          designer: 'unknown',
          category: 'dexterity',
        })
        .expect(201)
        .then(({ body: { review } }) => {
          expect(review).toMatchObject({
            review_id: 14,
            title: 'Takenoko',
            designer: 'unknown',
            owner: 'philippaclaire9',
            review_img_url:
              'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg?w=700&h=700',
            review_body: 'Fun with pandas!',
            category: 'dexterity',
            created_at: expect.any(String),
            votes: 0,
            comment_count: 0,
          })
        })
    })
    test('200: POST returns new review, ignoring extra properties', () => {
      return request(app)
        .post('/api/reviews')
        .send({
          owner: 'philippaclaire9',
          title: 'Takenoko',
          review_body: 'Fun with pandas!',
          designer: 'unknown',
          category: 'dexterity',
          something_else: 'test',
        })
        .expect(201)
        .then(({ body: { review } }) => {
          expect(review).toMatchObject({
            review_id: 14,
            title: 'Takenoko',
            designer: 'unknown',
            owner: 'philippaclaire9',
            review_img_url:
              'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg?w=700&h=700',
            review_body: 'Fun with pandas!',
            category: 'dexterity',
            created_at: expect.any(String),
            votes: 0,
            comment_count: 0,
          })
        })
    })
    test('400: POST returns invalid request when any keys are missing', () => {
      return request(app)
        .post('/api/reviews')
        .send({
          owner: 'philippaclaire9',
          title: 'Takenoko',
          review_body: 'Fun with pandas!',
          designer: 'unknown',
        })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe('Missing key information from body')
        })
    })
    test('404: POST returns category not found', () => {
      return request(app)
        .post('/api/reviews')
        .send({
          owner: 'philippaclaire9',
          title: 'Takenoko',
          review_body: 'Fun with pandas!',
          designer: 'unknown',
          category: 'panda fun',
        })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe(
            'Key (category)=(panda fun) is not present in table "categories".'
          )
        })
    })
    test('404: POST returns owner not found', () => {
      return request(app)
        .post('/api/reviews')
        .send({
          owner: 'Erin',
          title: 'Takenoko',
          review_body: 'Fun with pandas!',
          designer: 'unknown',
          category: 'dexterity',
        })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe(
            'Key (owner)=(Erin) is not present in table "users".'
          )
        })
    })
  })

  describe('postCategories', () => {
    test('201: POST returns newly added category object', () => {
      return request(app)
        .post('/api/categories')
        .send({
          slug: 'category name here',
          description: 'description here',
        })
        .expect(201)
        .then(({ body: { category } }) => {
          expect(category).toEqual({
            slug: 'category name here',
            description: 'description here',
          })
        })
    })
    test('201: POST returns new category, ignoring extra properties', () => {
      return request(app)
        .post('/api/categories')
        .send({
          slug: 'category name here',
          description: 'description here',
          extra: 'ignored',
        })
        .expect(201)
        .then(({ body: { category } }) => {
          expect(category).toEqual({
            slug: 'category name here',
            description: 'description here',
          })
        })
    })
    test('400: POST returns invalid request when slug is missing', () => {
      return request(app)
        .post('/api/categories')
        .send({
          description: 'description here',
        })
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe('Missing key information from body')
        })
    })
    test('201: POST returns category with description missing', () => {
      return request(app)
        .post('/api/categories')
        .send({
          slug: 'category name here',
        })
        .expect(201)
        .then(({ body: { category } }) => {
          expect(category).toEqual({
            slug: 'category name here',
            description: null,
          })
        })
    })
  })
  describe('deleteReview', () => {
    test('204: DELETE returns no content', () => {
      return request(app).delete('/api/reviews/3').expect(204)
    })
    test('404: DELETE valid review id not found', () => {
      return request(app)
        .delete('/api/reviews/1000')
        .expect(404)
        .then(({ body: { msg } }) => expect(msg).toBe('review_id not found'))
    })
    test('400: DELETE returns an invalid request', () => {
      return request(app)
        .delete('/api/reviews/invalid')
        .expect(400)
        .then(({ body: { msg } }) => expect(msg).toBe('Invalid request'))
    })
  })
  describe('getUserVotes', () => {
    test('200: GET returns users likes and dislikes', () => {
      return request(app)
        .get('/api/users/bainesface/votes')
        .expect(200)
        .then(({ body: { userVotes } }) => {
          expect(userVotes).toHaveProperty('likes')
          expect(userVotes).toHaveProperty('dislikes')
        })
    })
    test('200: Get returns empty array', () => {
      return request(app)
        .get('/api/users/dav3rid/votes')
        .expect(200)
        .then(({ body: { userVotes } }) => {
          expect(userVotes.likes.length).toBe(0)
          expect(userVotes.dislikes.length).toBe(0)
        })
    })
    test('404: Returns user not found', () => {
      return request(app)
        .get('/api/users/fakeuser/votes')
        .expect(404)
        .then(({ body }) => {
          expect(body.msg).toBe('username not found')
        })
    })
  })
  describe('postUserVote', () => {
    test('201: returns new user vote', () => {
      return request(app)
        .post('/api/users/bainesface/votes')
        .send({ review_id: 4, vote: 1 })
        .expect(201)
        .then(({ body }) => {
          expect(body.uservote).toEqual({
            username: 'bainesface',
            review_id: 4,
            vote: 1,
          })
        })
    })
    test('201: ignore extra properties', () => {
      return request(app)
        .post('/api/users/bainesface/votes')
        .send({ review_id: 4, vote: 1, another: 10 })
        .expect(201)
        .then(({ body }) => {
          expect(body.uservote).toEqual({
            username: 'bainesface',
            review_id: 4,
            vote: 1,
          })
        })
    })
    test('400: POST returns invalid request when key is missing', () => {
      return request(app)
        .post('/api/users/bainesface/votes')
        .send({ review_id: 4 })
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe('Missing key information from body')
        })
    })
    test('200: POST request returns updated user vote', () => {
      return request(app)
        .post('/api/users/bainesface/votes')
        .send({ review_id: 1, vote: 1 })
        .expect(201)
        .then(({ body }) => {
          expect(body.uservote).toEqual({
            username: 'bainesface',
            review_id: 1,
            vote: 0,
          })
        })
    })
    test('404: POST request returns user not found', () => {
      return request(app)
        .post('/api/users/blah/votes')
        .send({ review_id: 1, vote: 1 })
        .expect(404)
        .then(({ body }) => {
          expect(body.msg).toBe(
            'Key (username)=(blah) is not present in table "users".'
          )
        })
    })
  })
  describe('userVoteCats', () => {
    test('200:returns userVoteCats', () => {
      return request(app)
        .get('/api/users/bainesface/votes/categories')
        .expect(200)
        .then(({ body: { userVoteCategories } }) => {
          expect(userVoteCategories).toHaveProperty('likes')
          expect(userVoteCategories).toHaveProperty('dislikes')
          expect(userVoteCategories).toHaveProperty('neutral')
        })
    })
    test('200: Get returns empty array', () => {
      return request(app)
        .get('/api/users/dav3rid/votes/categories')
        .expect(200)
        .then(({ body: { userVoteCategories } }) => {
          expect(userVoteCategories.likes.length).toBe(0)
          expect(userVoteCategories.dislikes.length).toBe(0)
        })
    })
  })
})
